import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

interface NavbarProps {
  onCreateRoomClick?: () => void;
  onJoinRoomClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCreateRoomClick, onJoinRoomClick }) => {
  return (
    <header className="sticky top-0 z-50 w-full apple-nav-glass transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
        {/* Apple-Style Minimalist Brand Logo & Wordmark */}
        <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-85">
          <div className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center text-white shadow-sm">
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          </div>
          <span className="text-base sm:text-lg font-semibold tracking-tight text-[#1D1D1F]">
            SyncPlay
          </span>
        </Link>

        {/* Clean Apple-Style Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onJoinRoomClick && (
            <button
              onClick={onJoinRoomClick}
              className="apple-btn-secondary px-3.5 py-1.5 text-xs font-medium cursor-pointer"
            >
              Join Room
            </button>
          )}

          {onCreateRoomClick && (
            <button
              onClick={onCreateRoomClick}
              className="apple-btn-primary px-4 py-1.5 text-xs font-medium cursor-pointer"
            >
              Create Room
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
