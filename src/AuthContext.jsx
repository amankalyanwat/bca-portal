// src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const DEVICE_STORAGE_KEY = "bca-material-device-id";
const SESSION_LOCK_MESSAGE_KEY = "bca-session-lock-message";
const AuthContext = createContext(null);

function setSessionLockMessage(message) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_LOCK_MESSAGE_KEY, message);
  }
}

function clearSessionLockMessage() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_LOCK_MESSAGE_KEY);
  }
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") {
    return "server-device";
  }

  let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);

  if (!deviceId) {
    deviceId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
  }

  return deviceId;
}

async function ensureUserProfile(uid) {
  const profileRef = doc(db, "users", uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    throw new Error("User profile is missing. Please contact the admin.");
  }

  return { profileRef, profileSnap };
}

async function activateDeviceForUser(uid, deviceId) {
  const { profileRef } = await ensureUserProfile(uid);
  const previousDeviceId = (await getDoc(profileRef)).data()?.activeDeviceId || (await getDoc(profileRef)).data()?.deviceId || null;

  await setDoc(
    profileRef,
    {
      activeDeviceId: deviceId,
      deviceId,
      lastLoginAt: new Date().toISOString(),
      previousDeviceId,
      lastSeenAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [allowedSemester, setAllowedSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setAllowedSemester(null);
        setLoading(false);
        return;
      }

      try {
        const { profileSnap } = await ensureUserProfile(currentUser.uid);
        setUser(currentUser);
        setAllowedSemester(profileSnap.data().semester ?? null);
      } catch (error) {
        console.error("Unable to load the user profile:", error);
        setUser(null);
        setAllowedSemester(null);
        setLoading(false);
        return;
      }

      setLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const deviceId = getOrCreateDeviceId();
    const profileRef = doc(db, "users", user.uid);

    const unsubscribeProfile = onSnapshot(profileRef, async (profileSnap) => {
      if (!profileSnap.exists()) {
        return;
      }

      const profileData = profileSnap.data();
      const activeDeviceId = profileData.activeDeviceId || profileData.deviceId;

      if (activeDeviceId && activeDeviceId !== deviceId) {
        setSessionLockMessage("This account is already active on another device. You have been signed out.");
        await signOut(auth);
        setUser(null);
        setAllowedSemester(null);
        return;
      }

      setAllowedSemester(profileData.semester ?? null);
    });

    return unsubscribeProfile;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const handleBeforeUnload = async () => {
      try {
        const profileRef = doc(db, "users", user.uid);
        await setDoc(profileRef, { activeDeviceId: null }, { merge: true });
      } catch (error) {
        console.warn("Unable to clear session on unload:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const deviceId = getOrCreateDeviceId();

    try {
      clearSessionLockMessage();

      await activateDeviceForUser(userCredential.user.uid, deviceId);
      return userCredential;
    } catch (error) {
      const message =
        error?.message ||
        "This account is already active on another device. Please sign out from that device first.";

      setSessionLockMessage(message);
      await signOut(auth);
      throw new Error(message);
    }
  };

  const logout = async () => {
    clearSessionLockMessage();

    if (user) {
      const profileRef = doc(db, "users", user.uid);
      await setDoc(profileRef, { activeDeviceId: null }, { merge: true });
    }

    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, allowedSemester }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
