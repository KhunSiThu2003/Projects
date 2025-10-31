// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "reactchatapp-427dd.firebaseapp.com",
  projectId: "reactchatapp-427dd",
  storageBucket: "reactchatapp-427dd.firebasestorage.app",
  messagingSenderId: "981405791721",
  appId: "1:981405791721:web:d7e333807b7bf81b114778"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();