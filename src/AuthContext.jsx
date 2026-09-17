// src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const DEVICE_STORAGE_KEY = "bca-material-device-id";
const SESSION_LOCK_MESSAGE_KEY = "bca-session-lock-message";
const LOGIN_TIMEOUT_MS = 15000;
const AuthContext = createContext(null);

function withTimeout(promise, message) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), LOGIN_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

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

async function ensureUserProfile(uid, fallbackUser = null) {
  const profileRef = doc(db, "users", uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    const profileData = {
      email: fallbackUser?.email || "",
      name: fallbackUser?.displayName || "",
      semester: null,
      role: "student",
      createdAt: new Date().toISOString(),
    };

    await setDoc(profileRef, profileData, { merge: true });
    const freshSnap = await getDoc(profileRef);
    return { profileRef, profileSnap: freshSnap };
  }

  return { profileRef, profileSnap };
}

async function activateDeviceForUser(uid, deviceId, fallbackUser = null) {
  const { profileRef, profileSnap } = await ensureUserProfile(uid, fallbackUser);
  const profileData = profileSnap.data();
  const previousDeviceId = profileData?.activeDeviceId || profileData?.deviceId || null;

  await withTimeout(
    setDoc(
      profileRef,
      {
        activeDeviceId: deviceId,
        deviceId,
        lastLoginAt: new Date().toISOString(),
        previousDeviceId,
        lastSeenAt: new Date().toISOString(),
      },
      { merge: true }
    ),
    "Profile update timed out. Check your internet connection and try again."
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
        const { profileSnap } = await ensureUserProfile(currentUser.uid, currentUser);
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
    const userCredential = await withTimeout(
      signInWithEmailAndPassword(auth, email, password),
      "Sign-in timed out. Check your internet connection and try again."
    );
    const deviceId = getOrCreateDeviceId();

    try {
      clearSessionLockMessage();

      await activateDeviceForUser(userCredential.user.uid, deviceId, userCredential.user);
      return userCredential;
    } catch (error) {
      console.error("Login failed:", error);
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
