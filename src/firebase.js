// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// 🔽 Apna Firebase project config yaha paste karo
// Firebase Console -> Project Settings -> General -> Your apps -> SDK config
const firebaseConfig = {
  apiKey: "AIzaSyDZEbXMSasTnNwbZVnRffHfab2pa7zPRFQ",
  authDomain: "bcamaterialportal.firebaseapp.com",
  projectId: "bcamaterialportal",
  messagingSenderId: "411009756007",
  appId: "1:411009756007:web:9afbf6b7e359ec62691dc2",
  // Add VITE_FIREBASE_DATABASE_URL to .env after enabling Realtime Database.
  ...(import.meta.env.VITE_FIREBASE_DATABASE_URL ? { databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL } : {})
};


const app = initializeApp(firebaseConfig);
const secondaryApp = initializeApp(firebaseConfig, "student-account-app");

export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
