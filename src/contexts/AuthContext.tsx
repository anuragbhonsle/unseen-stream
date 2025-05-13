
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
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: (customUsername?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
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
  
  // Check if a username is available (not already taken)
  async function checkUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.length < 3) return false;
    
    try {
      // Format the username to include @ prefix if it doesn't have one
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", formattedUsername));
      const querySnapshot = await getDocs(q);
      
      // If the query is empty, the username is available
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  }
  
  async function loginWithGoogle(customUsername?: string): Promise<void> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data().username) {
        // User exists, update auth profile to match Firestore
        await firebaseUpdateProfile(user, {
          displayName: userDoc.data().username
        });
      } else {
        // This is a new user or one without a username
        let username: string;
        
        if (customUsername) {
          // Format the custom username to include @ prefix
          username = customUsername.startsWith('@') ? customUsername : `@${customUsername}`;
          
          // Make sure the custom username is unique
          const isAvailable = await checkUsernameAvailable(username);
          if (!isAvailable) {
            throw new Error("Username already taken. Please choose another.");
          }
        } else {
          // Create default username from email (before @ symbol)
          const defaultUsername = `@${user.email?.split('@')[0] || ''}`;
          username = defaultUsername;
        }
        
        // Create/update the user document
        await setDoc(doc(db, "users", user.uid), {
          username,
          email: user.email,
          createdAt: serverTimestamp(),
          authProvider: 'google'
        }, { merge: true });
        
        // Update the auth profile
        await firebaseUpdateProfile(user, {
          displayName: username
        });
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  }

  async function updateUsername(newUsername: string): Promise<void> {
    if (!currentUser) throw new Error("No user logged in");
    
    try {
      // Format the username to include @ prefix
      const formattedUsername = newUsername.startsWith('@') ? newUsername : `@${newUsername}`;
      
      // Check if username is already taken
      const isAvailable = await checkUsernameAvailable(formattedUsername);
      if (!isAvailable) {
        throw new Error("Username already taken. Please choose another.");
      }
      
      // Update in Firebase Auth
      await firebaseUpdateProfile(currentUser, {
        displayName: formattedUsername
      });
      
      // Update in Firestore
      await setDoc(doc(db, "users", currentUser.uid), {
        username: formattedUsername
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
    updateUsername,
    checkUsernameAvailable
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
