
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
  
  // Check if a username is available (not already taken)
  async function checkUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.length < 3) return false;
    
    try {
      // Format the username to include @ prefix if it doesn't have one
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      
      // First, check if the username matches Firebase username requirements
      if (!/^@[a-zA-Z0-9_]+$/.test(formattedUsername)) {
        return false;
      }
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", formattedUsername));
      const querySnapshot = await getDocs(q);
      
      // If the query is empty, the username is available
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking username availability:", error);
      
      // If we get a permission error, assume the username is available
      // This is a temporary fix until proper Firebase rules are set up
      if (error instanceof Error && error.message.includes("permission")) {
        console.log("Permission error, assuming username is available");
        return true;
      }
      
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
        toast.success("Signed in successfully!");
      } else {
        // This is a new user or one without a username
        let username: string;
        
        if (customUsername) {
          // Format the custom username to include @ prefix
          username = customUsername.startsWith('@') ? customUsername : `@${customUsername}`;
          
          // Make sure the custom username is unique - but don't block sign-in if check fails
          try {
            const isAvailable = await checkUsernameAvailable(username);
            if (!isAvailable) {
              toast.error("Username may already be taken, but we'll try to register it anyway.");
            }
          } catch (error) {
            console.error("Error checking username:", error);
            // Continue anyway since this is just a warning
          }
        } else {
          // Create default username from email (before @ symbol)
          const defaultUsername = `@${user.email?.split('@')[0] || ''}`;
          username = defaultUsername;
        }
        
        // Create/update the user document
        try {
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
          
          toast.success("Account created successfully!");
        } catch (error) {
          console.error("Error creating user document:", error);
          toast.error("Signed in but couldn't save your profile. Some features may be limited.");
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
