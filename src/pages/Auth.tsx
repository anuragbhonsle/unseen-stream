
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signup";
  
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGoogleUsername, setShowGoogleUsername] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { signup, login, loginWithGoogle, currentUser } = useAuth();
  
  useEffect(() => {
    if (currentUser) {
      navigate("/inbox");
    }
  }, [currentUser, navigate]);
  
  useEffect(() => {
    setIsLogin(mode === "login");
    setError("");
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Signed in successfully!");
        navigate("/inbox");
      } else {
        if (!username || username.length < 3) {
          setError("Username must be at least 3 characters");
          setLoading(false);
          return;
        }
        
        // Check if username is valid (only letters, numbers, underscores)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setError("Username can only contain letters, numbers, and underscores");
          setLoading(false);
          return;
        }
        
        await signup(email, password, username);
        toast.success("Account created successfully!");
        navigate("/inbox");
      }
    } catch (error: any) {
      let message = "Failed to authenticate";
      
      if (error.code === "auth/email-already-in-use") {
        message = "Email is already in use";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "Invalid email or password";
      } else if (error.code === "auth/operation-not-allowed") {
        message = "This sign-in method is not enabled. Please enable it in the Firebase console.";
      } else if (error.message && error.message.includes("offline")) {
        message = "You appear to be offline. Please check your internet connection.";
      }
      
      setError(message);
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (showGoogleUsername) {
      if (!username || username.length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError("Username can only contain letters, numbers, and underscores");
        return;
      }
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Always pass the username when using Google sign-in if we're showing the username input
      // This ensures the custom username is used instead of the Google display name
      await loginWithGoogle(showGoogleUsername ? username : undefined);
      toast.success("Signed in with Google successfully!");
      navigate("/inbox");
    } catch (error: any) {
      let message = "Failed to sign in with Google";
      
      if (error.message && error.message.includes("offline")) {
        message = "Network error. Please check your internet connection.";
      } else if (error.code === "auth/operation-not-allowed") {
        message = "Google sign-in is not enabled. Please enable it in the Firebase console.";
      } else if (error.code === "auth/popup-closed-by-user") {
        message = "Sign-in popup was closed before completing the process.";
      }
      
      setError(message);
      console.error("Google sign in error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleGoogleUsername = () => {
    setShowGoogleUsername(!showGoogleUsername);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <div className="card-glass max-w-md w-full animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h2>
        
        {error && (
          <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {showGoogleUsername ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-username">Choose a Username</Label>
              <Input
                id="google-username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass"
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be your unique Visper link: {window.location.origin}/{username}
              </p>
            </div>
            
            <Button 
              onClick={handleGoogleSignIn} 
              className="w-full bg-primary hover:bg-primary/80"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Continue with Google"}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={toggleGoogleUsername}
              className="w-full text-sm"
            >
              Back
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="glass"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your unique Visper link: {window.location.origin}/{username}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/80"
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted-foreground/20"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                type="button"
                variant="outline" 
                onClick={toggleGoogleUsername}
                disabled={loading}
                className="w-full"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Sign in with Google
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                {" "}
                <a 
                  href={`/auth?mode=${isLogin ? "signup" : "login"}`}
                  className="text-primary hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLogin(!isLogin);
                    setError("");
                    const newUrl = `/auth?mode=${isLogin ? "signup" : "login"}`;
                    window.history.pushState({}, "", newUrl);
                  }}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
