
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDlEACfKbqIbdhPRsXaKfL4cZ3e6ZzqmUQ",
  authDomain: "whispr-d376f.firebaseapp.com",
  projectId: "whispr-d376f",
  storageBucket: "whispr-d376f.appspot.com", // Fixed: replaced .firebasestorage.app with .appspot.com
  messagingSenderId: "728189677744",
  appId: "1:728189677744:web:61747879b0fa10554ccb75",
  measurementId: "G-YFM3T6K7DJ"
};

// Check if Firebase app is already initialized to prevent duplicate initialization
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If an app already exists, use that one
  app = initializeApp(firebaseConfig, "whispr-app");
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Only initialize analytics in browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export { analytics };
