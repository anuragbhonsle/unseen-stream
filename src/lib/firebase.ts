
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDlEACfKbqIbdhPRsXaKfL4cZ3e6ZzqmUQ",
  authDomain: "whispr-d376f.firebaseapp.com",
  projectId: "whispr-d376f",
  storageBucket: "whispr-d376f.firebasestorage.app",
  messagingSenderId: "728189677744",
  appId: "1:728189677744:web:61747879b0fa10554ccb75",
  measurementId: "G-YFM3T6K7DJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
