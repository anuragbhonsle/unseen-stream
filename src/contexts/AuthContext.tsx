import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  updateProfile as firebaseUpdateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, enableNetwork, enableIndexedDbPersistence } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (customUsername?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Enable offline persistence on initial load
  useEffect(() => {
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log("Offline persistence enabled");
      })
      .catch((error) => {
        console.error("Error enabling offline persistence:", error);
      });
  }, []);

  async function signup(email: string, password: string, username: string): Promise<void> {
    try {
      // Ensure network is enabled
      await enableNetwork(db);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
        createdAt: serverTimestamp(),
      });
      
      // Update user display name
      await firebaseUpdateProfile(userCredential.user, {
        displayName: username
      });
    } catch (error) {
      throw error;
    }
  }

  async function login(email: string, password: string): Promise<void> {
    try {
      // Ensure network is enabled
      await enableNetwork(db);
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }
  
  async function loginWithGoogle(customUsername?: string): Promise<void> {
    try {
      // Ensure network is enabled
      await enableNetwork(db);
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // If a custom username was provided, use it
      // Otherwise check if this user already has a username in Firestore
      if (customUsername) {
        // Update both Firestore and Auth profile with the custom username
        await setDoc(doc(db, "users", user.uid), {
          username: customUsername,
          email: user.email,
          createdAt: serverTimestamp(),
          authProvider: 'google'
        }, { merge: true });
        
        // Update user display name
        await firebaseUpdateProfile(user, {
          displayName: customUsername
        });
        
        return;
      }
      
      // Check if this user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data().username) {
        // User exists and has a username, update auth profile to match Firestore
        await firebaseUpdateProfile(user, {
          displayName: userDoc.data().username
        });
      } else {
        // This is a new user or one without a username
        // For new users, we'll use a default username based on email
        const defaultUsername = user.email?.split('@')[0] || '';
        
        await setDoc(doc(db, "users", user.uid), {
          username: defaultUsername,
          email: user.email,
          createdAt: serverTimestamp(),
          authProvider: 'google'
        }, { merge: true });
        
        await firebaseUpdateProfile(user, {
          displayName: defaultUsername
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async function updateUsername(username: string): Promise<void> {
    if (!currentUser) throw new Error("No user logged in");
    
    try {
      // Ensure network is enabled
      await enableNetwork(db);
      
      // Update in Firebase Auth
      await firebaseUpdateProfile(currentUser, {
        displayName: username
      });
      
      // Update in Firestore
      await setDoc(doc(db, "users", currentUser.uid), {
        username
      }, { merge: true });
    } catch (error) {
      throw error;
    }
  }

  async function logout(): Promise<void> {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUsername
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
