import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Users, LogIn } from 'lucide-react';

interface NavbarProps {
  onCreateRoomClick?: () => void;
  onJoinRoomClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCreateRoomClick, onJoinRoomClick }) => {
  const location = useLocation();
  const isRoomPage = location.pathname.startsWith('/room/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-background-primary/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center">
            Sync<span className="text-accent-secondary">Play</span>
          </span>
        </Link>

        {/* Center Links (on landing/home) */}
        {!isRoomPage && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <a href="#hero" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
          </nav>
        )}

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {onJoinRoomClick && (
            <button
              onClick={onJoinRoomClick}
              className="px-3.5 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-background-elevated rounded-xl transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Join Room</span>
            </button>
          )}

          {onCreateRoomClick && (
            <button
              onClick={onCreateRoomClick}
              className="accent-gradient-btn px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-glow flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
