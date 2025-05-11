
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <nav className="w-full py-4 px-6 md:px-16 flex items-center justify-between glass fixed top-0 z-50">
      <Link to="/" className="flex items-center">
        <h1 className="font-bold text-xl text-foreground">
          <span className="text-primary">Whispr</span>
        </h1>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-6">
        <Link to="/" className="text-foreground hover:text-primary transition-colors">
          Home
        </Link>
        <Link to="/about" className="text-foreground hover:text-primary transition-colors">
          About
        </Link>
        
        {currentUser ? (
          <>
            <Link to="/inbox" className="text-foreground hover:text-primary transition-colors">
              Inbox
            </Link>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-foreground hover:text-primary transition-colors"
            >
              Log Out
            </Button>
          </>
        ) : (
          <Link to="/auth">
            <Button variant="default" className="bg-primary hover:bg-primary/80 transition-colors">
              Sign In
            </Button>
          </Link>
        )}
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full p-5 glass md:hidden flex flex-col space-y-4 mt-2 rounded-b-2xl animate-fade-in">
          <Link 
            to="/" 
            className="text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className="text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          
          {currentUser ? (
            <>
              <Link 
                to="/inbox" 
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Inbox
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="text-left text-foreground hover:text-primary transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link 
              to="/auth"
              onClick={() => setIsMenuOpen(false)}
            >
              <Button variant="default" className="bg-primary hover:bg-primary/80 w-full transition-colors">
                Sign In
              </Button>
            </Link>
          )}
          
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
            >
              {theme === "dark" ? (
                <>
                  <Sun size={18} />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={18} />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
