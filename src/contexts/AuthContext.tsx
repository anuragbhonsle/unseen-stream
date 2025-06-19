
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
import { toast } from "sonner";

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
  
  async function checkUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.length < 3) return false;
    
    try {
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      
      if (!/^@[a-zA-Z0-9_]+$/.test(formattedUsername)) {
        return false;
      }
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", formattedUsername));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking username availability:", error);
      // Return true to allow sign-in attempt if check fails
      return true;
    }
  }
  
  async function loginWithGoogle(customUsername?: string): Promise<void> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data().username) {
        // User exists with username, update auth profile
        await firebaseUpdateProfile(user, {
          displayName: userDoc.data().username
        });
        toast.success("Signed in successfully!");
      } else {
        // New user or existing user without username
        let username: string;
        
        if (customUsername) {
          username = customUsername.startsWith('@') ? customUsername : `@${customUsername}`;
        } else {
          // Create default username from email
          const emailPrefix = user.email?.split('@')[0] || 'user';
          username = `@${emailPrefix}`;
        }
        
        try {
          await setDoc(doc(db, "users", user.uid), {
            username,
            email: user.email,
            createdAt: serverTimestamp(),
            authProvider: 'google'
          }, { merge: true });
          
          await firebaseUpdateProfile(user, {
            displayName: username
          });
          
          toast.success("Account created successfully!");
        } catch (error) {
          console.error("Error creating user document:", error);
          toast.success("Signed in successfully!");
        }
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Sign-in failed. Please try again.");
      throw error;
    }
  }

  async function updateUsername(newUsername: string): Promise<void> {
    if (!currentUser) throw new Error("No user logged in");
    
    try {
      const formattedUsername = newUsername.startsWith('@') ? newUsername : `@${newUsername}`;
      
      const isAvailable = await checkUsernameAvailable(formattedUsername);
      if (!isAvailable) {
        throw new Error("Username already taken. Please choose another.");
      }
      
      await firebaseUpdateProfile(currentUser, {
        displayName: formattedUsername
      });
      
      await setDoc(doc(db, "users", currentUser.uid), {
        username: formattedUsername
      }, { merge: true });
      
      toast.success("Username updated successfully!");
    } catch (error) {
      console.error("Username update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update username");
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out");
      throw error;
    }
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
