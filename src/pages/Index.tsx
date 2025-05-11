
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowDown } from 'lucide-react';

const Index = () => {
  const { currentUser } = useAuth();
  const typingTextRef = useRef<HTMLParagraphElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const text = "Share your thoughts into the void...";
    if (typingTextRef.current) {
      typingTextRef.current.textContent = "";
      
      let i = 0;
      const typeWriter = () => {
        if (i < text.length && typingTextRef.current) {
          typingTextRef.current.textContent += text.charAt(i);
          i++;
          setTimeout(typeWriter, 100);
        }
      };
      
      typeWriter();
    }
  }, []);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-20 min-h-[90vh] relative">
        <div className="max-w-3xl w-full text-center space-y-8 z-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Anonymous Messages.
            <br />
            <span className="text-primary">Zero Judgment.</span>
          </h1>
          
          <div className="typing-container">
            <p ref={typingTextRef} className="text-xl md:text-2xl text-muted-foreground pb-2"></p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            {currentUser ? (
              <Link to="/inbox">
                <Button className="bg-primary hover:bg-primary/80 transition-colors">
                  Go to My Inbox
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/80 transition-colors w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/auth?mode=login">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce">
            <button onClick={scrollToHowItWorks} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <span>Learn More</span>
              <ArrowDown size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-20 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How Whispr Works</h2>

          <div className="card-glass max-w-4xl mx-auto">
            <div className="mb-10 text-center">
              <p className="text-lg text-muted-foreground">
                Get a personal link that lets anyone send you anonymous messages.
                You'll see them in your private inbox.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-medium mb-2">Create Account</h3>
                <p className="text-muted-foreground">Sign up in seconds and get your unique Whispr link</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-medium mb-2">Share Your Link</h3>
                <p className="text-muted-foreground">Send it to friends or post on your social media profiles</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-medium mb-2">Receive Messages</h3>
                <p className="text-muted-foreground">Check your private inbox for anonymous messages</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              {currentUser ? (
                <Link to="/inbox">
                  <Button className="bg-primary hover:bg-primary/80 transition-colors">
                    View My Inbox
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/80 transition-colors">
                    Create Your Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to hear what people really think?</h2>
          <p className="text-muted-foreground">
            Join thousands of users receiving honest, anonymous feedback through Whispr.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {currentUser ? (
              <Link to="/inbox">
                <Button className="bg-primary hover:bg-primary/80 transition-colors px-8">
                  Check My Messages
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/80 transition-colors w-full sm:w-auto px-8">
                    Get My Whispr Link
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
