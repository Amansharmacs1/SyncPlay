import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-secondary mb-6 shadow-glow">
        <span className="text-2xl font-black font-mono">404</span>
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">Page Not Found</h1>
      <p className="text-sm text-text-muted max-w-sm mb-8">
        The page or watch room you are looking for doesn't exist or has expired.
      </p>
      <Link
        to="/"
        className="accent-gradient-btn px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-glow flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
