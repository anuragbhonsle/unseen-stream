
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Clipboard } from "lucide-react";
import MessageCard from "@/components/MessageCard";

interface Message {
  id: string;
  message: string;
  timestamp: any;
  reported: boolean;
}

const Inbox = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    const username = currentUser.displayName;
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("recipientUsername", "==", username),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: Message[] = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          message: doc.data().message,
          timestamp: doc.data().timestamp,
          reported: doc.data().reported || false
        });
      });
      setMessages(messagesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser, navigate]);
  
  const copyLinkToClipboard = () => {
    if (!currentUser || !currentUser.displayName) return;
    
    const link = `${window.location.origin}/${currentUser.displayName}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        toast.success("Whispr link copied to clipboard!");
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy link");
      });
  };

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card-glass mb-8">
          <h1 className="text-2xl font-bold mb-4">Your Whispr Inbox</h1>
          
          <div className="mb-6">
            <p className="text-muted-foreground mb-2">
              Share your unique link to receive anonymous messages:
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-secondary p-2 px-3 rounded-lg flex-1 text-sm md:text-base overflow-hidden">
                {currentUser && currentUser.displayName ? (
                  <span>{window.location.origin}/{currentUser.displayName}</span>
                ) : (
                  <span>Loading...</span>
                )}
              </div>
              <Button 
                onClick={copyLinkToClipboard}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Clipboard size={16} />
                Copy
              </Button>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-4">Your Messages</h2>
        
        {loading ? (
          <p className="text-muted-foreground">Loading messages...</p>
        ) : messages.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                id={message.id}
                message={message.message}
                timestamp={message.timestamp}
                reported={message.reported}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-4">
              Share your Whispr link with friends to start receiving anonymous messages.
            </p>
            <Button 
              onClick={copyLinkToClipboard}
              className="bg-primary hover:bg-primary/80"
            >
              Copy My Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
