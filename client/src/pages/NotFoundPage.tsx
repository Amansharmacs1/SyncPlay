import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3] mb-5 shadow-xs">
        <span className="text-xl font-bold font-mono">404</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight mb-2">Page Not Found</h1>
      <p className="text-sm text-[#86868B] max-w-sm mb-8">
        The watch party room or link you are looking for doesn't exist or has ended.
      </p>
      <Link
        to="/"
        className="apple-btn-primary px-6 py-2.5 text-sm font-medium inline-flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
