
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDsAr574SATnM34oQqTX0B4P7Rbu48ISfM",
  authDomain: "visper-6814d.firebaseapp.com",
  projectId: "visper-6814d",
  storageBucket: "visper-6814d.firebasestorage.app",
  messagingSenderId: "80743846349",
  appId: "1:80743846349:web:118025284726fa234bb484",
  measurementId: "G-3HQS5LPE01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Only initialize analytics in browser environment
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export { analytics };
