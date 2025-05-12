
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

  async function signup(email: string, password: string, username: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
        createdAt: serverTimestamp(),
      });
      
      // Update user display name
      await updateProfile(userCredential.user, {
        displayName: username
      });
    } catch (error) {
      throw error;
    }
  }

  async function login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }
  
  async function loginWithGoogle(customUsername?: string): Promise<void> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if this is a new user
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      let username = customUsername;
      
      // If no custom username was provided, generate one from display name or email
      if (!username) {
        username = user.displayName ? 
          user.displayName.toLowerCase().replace(/\s+/g, '_') : 
          user.email?.split('@')[0] || '';
          
        // Add random numbers if username is less than 3 characters
        if (username.length < 3) {
          username += Math.floor(1000 + Math.random() * 9000);
        }
      }
      
      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username,
        email: user.email,
        createdAt: serverTimestamp(),
        authProvider: 'google'
      }, { merge: true });
      
      // Update user display name
      await updateProfile(user, {
        displayName: username
      });
    } catch (error) {
      throw error;
    }
  }

  async function updateUsername(username: string): Promise<void> {
    if (!currentUser) throw new Error("No user logged in");
    
    try {
      // Update in Firebase Auth
      await updateProfile(currentUser, {
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
