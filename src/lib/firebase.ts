
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  connectFirestoreEmulator
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { toast } from "sonner";

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

// Enable offline persistence when possible
try {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('Firestore persistence disabled: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The browser doesn't support IndexedDB
        console.warn('Firestore persistence not supported by this browser');
      }
    });
} catch (error) {
  console.warn('Error enabling Firestore persistence:', error);
}

export const googleProvider = new GoogleAuthProvider();

// Only initialize analytics in browser environment
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export { analytics };

// Add error handler for Firebase operations
export const handleFirebaseError = (error: any) => {
  console.error("Firebase operation failed:", error);
  
  let errorMessage = "An error occurred";
  
  if (error.code === "permission-denied") {
    errorMessage = "Access denied. Please check your permissions.";
  } else if (error.code === "not-found") {
    errorMessage = "The requested resource was not found.";
  } else if (error.code === "already-exists") {
    errorMessage = "This resource already exists.";
  } else if (error.code === "resource-exhausted") {
    errorMessage = "Too many requests. Please try again later.";
  } else if (error.code === "failed-precondition") {
    errorMessage = "Operation failed due to a precondition.";
  } else if (error.code === "unauthenticated") {
    errorMessage = "Authentication required.";
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  toast.error(errorMessage);
  return errorMessage;
};
