// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// 🔽 Apna Firebase project config yaha paste karo
// Firebase Console -> Project Settings -> General -> Your apps -> SDK config
const firebaseConfig = {
  apiKey: "AIzaSyDZEbXMSasTnNwbZVnRffHfab2pa7zPRFQ",
  authDomain: "bcamaterialportal.firebaseapp.com",
  projectId: "bcamaterialportal",
  messagingSenderId: "411009756007",
  appId: "1:411009756007:web:9afbf6b7e359ec62691dc2"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
