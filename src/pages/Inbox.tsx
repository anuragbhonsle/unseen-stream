
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  enableNetwork,
  limit,
  getDocs,
} from "firebase/firestore";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesPerPage = 10;

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    const username = currentUser.displayName;
    
    if (!username) {
      toast.error("Your username is not set. Please contact support.");
      setLoading(false);
      return;
    }

    // Enable network and load initial messages
    const loadInitialMessages = async () => {
      try {
        await enableNetwork(db);
        
        const messagesRef = collection(db, "messages");
        const q = query(
          messagesRef,
          where("recipientUsername", "==", username),
          orderBy("timestamp", "desc"),
          limit(messagesPerPage)
        );

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const messagesData: Message[] = [];
            querySnapshot.forEach((doc) => {
              messagesData.push({
                id: doc.id,
                message: doc.data().message,
                timestamp: doc.data().timestamp,
                reported: doc.data().reported || false,
              });
            });
            setMessages(messagesData);
            setLoading(false);
            setHasMore(messagesData.length === messagesPerPage);
          },
          (error) => {
            console.error("Error loading messages:", error);
            toast.error("Error loading messages. Please try again.");
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Error loading initial messages:", error);
        setLoading(false);
        return () => {};
      }
    };

    const unsubscribe = loadInitialMessages();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, navigate]);

  const loadMoreMessages = async () => {
    if (!currentUser || !currentUser.displayName || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const messagesRef = collection(db, "messages");
      const lastMessage = messages[messages.length - 1];
      
      const q = query(
        messagesRef,
        where("recipientUsername", "==", currentUser.displayName),
        orderBy("timestamp", "desc"),
        limit(messagesPerPage)
      );
      
      const querySnapshot = await getDocs(q);
      
      const newMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        if (!messages.some(m => m.id === doc.id)) {
          newMessages.push({
            id: doc.id,
            message: doc.data().message,
            timestamp: doc.data().timestamp,
            reported: doc.data().reported || false,
          });
        }
      });
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages]);
      }
      
      setHasMore(newMessages.length === messagesPerPage);
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast.error("Failed to load more messages");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (!currentUser || !currentUser.displayName) return;

    const link = `${window.location.origin}/${currentUser.displayName}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success("Visper link copied to clipboard!");
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
          <h1 className="text-2xl font-bold mb-4">Your Visper Inbox</h1>

          <div className="mb-6">
            <p className="text-muted-foreground mb-2">
              Share your username to receive anonymous messages:
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-secondary p-2 px-3 rounded-lg flex-1 text-sm md:text-base overflow-hidden">
                {currentUser && currentUser.displayName ? (
                  <span className="font-medium">{currentUser.displayName}</span>
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
                Copy Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Others can message you by going to: {window.location.origin}/{currentUser?.displayName}
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Your Messages</h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          <>
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
            
            {hasMore && (
              <div className="mt-6 text-center">
                <Button
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                  variant="outline"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    "Load More Messages"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-4">
              Share your Visper username with friends to start receiving anonymous
              messages.
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
