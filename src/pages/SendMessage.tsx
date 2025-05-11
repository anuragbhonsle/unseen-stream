
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SendMessage = () => {
  const { username } = useParams<{ username: string }>();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  
  useEffect(() => {
    const checkUserExists = async () => {
      if (!username) {
        setUserExists(false);
        return;
      }
      
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        setUserExists(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking user:", error);
        setUserExists(false);
      }
    };
    
    checkUserExists();
  }, [username]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    
    if (message.length > 500) {
      toast.error("Message too long (max 500 characters)");
      return;
    }
    
    setLoading(true);
    
    try {
      await addDoc(collection(db, "messages"), {
        message: message.trim(),
        recipientUsername: username,
        timestamp: serverTimestamp(),
        reported: false
      });
      
      setMessage("");
      setSent(true);
      toast.success("Message sent anonymously!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };
  
  if (userExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (userExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
        <div className="card-glass max-w-md w-full text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The Whispr link you're trying to access doesn't exist.
          </p>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/80">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
        <div className="card-glass max-w-md w-full text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
          <p className="text-muted-foreground mb-6">
            Your anonymous message has been delivered to {username}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setSent(false)}
              className="bg-primary hover:bg-primary/80"
            >
              Send Another
            </Button>
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
      <div className="card-glass max-w-md w-full animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Send a message to {username}
        </h2>
        <p className="text-muted-foreground mb-6 text-center">
          This message will be sent anonymously.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your anonymous message here..."
            className="min-h-32 glass"
            required
          />
          <p className="text-xs text-right text-muted-foreground">
            {message.length}/500 characters
          </p>
          <Button 
            type="submit" 
            disabled={loading || !message.trim()}
            className="w-full bg-primary hover:bg-primary/80"
          >
            {loading ? "Sending..." : "Send Anonymously"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SendMessage;
