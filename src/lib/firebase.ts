// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Pastikan import ini ada

const firebaseConfig = {
  // HARDCODED FOR DEBUGGING (FIX 403)
  apiKey: "AIzaSyAvqTvItXWYsEp7JY_61Ks-djHRiO32O18", // Key Asli (Original)
  authDomain: "fdvp-db.firebaseapp.com",
  projectId: "fdvp-db",
  storageBucket: "fdvp-db.firebasestorage.app",
  messagingSenderId: "1085243279530",
  appId: "1:1085243279530:web:f6a32fe0abff4dae37e8d3",
  measurementId: "G-NF8P5HKCCJ",
};

// Singleton pattern
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);