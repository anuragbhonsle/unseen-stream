
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
      <div className="card-glass max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Oops! Page not found</p>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/80">Return Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
