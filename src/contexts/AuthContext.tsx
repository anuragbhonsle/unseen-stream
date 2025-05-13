import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  updateProfile as firebaseUpdateProfile
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  enableNetwork,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
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

  // No need to reconfigure Firestore here as it's done in the firebase.ts file
  // Just keep monitoring authentication state
  
  async function loginWithGoogle(customUsername?: string): Promise<void> {
    try {
      // Ensure network is enabled for reliable auth
      await enableNetwork(db);
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // If a custom username was provided, use it instead of Google display name
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
      
      // Check if this user already has records in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data().username) {
        // User exists and has a username, update auth profile to match Firestore
        await firebaseUpdateProfile(user, {
          displayName: userDoc.data().username
        });
      } else {
        // This is a new user or one without a username
        // Create default username from email (before @ symbol)
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
      console.error("Google login error:", error);
      // Throw a more user-friendly error
      if (error instanceof Error) {
        if (error.message.includes("offline")) {
          throw new Error("Network connection issue. Please check your internet connection.");
        }
      }
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
      console.error("Username update error:", error);
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
