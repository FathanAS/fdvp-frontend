// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Pastikan import ini ada

const firebaseConfig = {
  // HARDCODED CONFIG (DEBUG MODE)
  apiKey: "AIzaSyAEKtVSzx_kgl7U8727yCtjelz9oEG3knI",
  authDomain: "fdvp-db.firebaseapp.com",
  projectId: "fdvp-db",
  storageBucket: "fdvp-db.firebasestorage.app",
  messagingSenderId: "1085243279530",
  appId: "1:1085243279530:web:f6a32fe0abff4dae37e8d3",
  measurementId: "G-NF8P5HKCCJ",

  /*
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  */
};

// Singleton pattern
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);