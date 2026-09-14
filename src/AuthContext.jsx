// src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [allowedSemester, setAllowedSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase automatically checks if user is already logged in (persisted session)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch this user's allowed semester from Firestore "users" collection
        const profileRef = doc(db, "users", currentUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setAllowedSemester(profileSnap.data().semester);
          } else {
            setAllowedSemester(null); // no profile = no access
          }
        } catch (error) {
          console.error("Unable to load the user profile:", error);
          setAllowedSemester(null);
        }
      } else {
        setAllowedSemester(null);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
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
