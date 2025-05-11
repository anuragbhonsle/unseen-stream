
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signup";
  
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signup, login, currentUser } = useAuth();
  
  useEffect(() => {
    if (currentUser) {
      navigate("/inbox");
    }
  }, [currentUser, navigate]);
  
  useEffect(() => {
    setIsLogin(mode === "login");
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Signed in successfully!");
        navigate("/inbox");
      } else {
        if (!username || username.length < 3) {
          toast.error("Username must be at least 3 characters");
          setLoading(false);
          return;
        }
        
        // Check if username is valid (only letters, numbers, underscores)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          toast.error("Username can only contain letters, numbers, and underscores");
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
      }
      
      toast.error(message);
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <div className="card-glass max-w-md w-full animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h2>
        
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
                This will be your unique Whispr link: whispr.app/{username}
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
                const newUrl = `/auth?mode=${isLogin ? "signup" : "login"}`;
                window.history.pushState({}, "", newUrl);
              }}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
