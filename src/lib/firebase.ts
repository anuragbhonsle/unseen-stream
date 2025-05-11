
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDlEACfKbqIbdhPRsXaKfL4cZ3e6ZzqmUQ",
  authDomain: "whispr-d376f.firebaseapp.com",
  projectId: "whispr-d376f",
  storageBucket: "whispr-d376f.appspot.com",
  messagingSenderId: "728189677744",
  appId: "1:728189677744:web:61747879b0fa10554ccb75",
  measurementId: "G-YFM3T6K7DJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Only initialize analytics in browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export { analytics };
