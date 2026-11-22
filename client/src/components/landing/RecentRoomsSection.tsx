import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recentRoomsService, RecentRoom } from '../../services/recentRooms.js';
import { History, Play, Trash2, ArrowRight, ShieldCheck, Film } from 'lucide-react';

export const RecentRoomsSection: React.FC = () => {
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRecentRooms(recentRoomsService.getRecentRooms());
  }, []);

  if (recentRooms.length === 0) {
    return null;
  }

  const handleRejoin = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleRemove = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    recentRoomsService.removeRecentRoom(roomId);
    setRecentRooms(recentRoomsService.getRecentRooms());
  };

  const handleClearAll = () => {
    recentRoomsService.clearRecentRooms();
    setRecentRooms([]);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-background-card/80 border border-surface-border rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-card">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-secondary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Recently Visited Rooms</span>
                <span className="text-xs font-mono font-normal text-text-muted px-2 py-0.5 rounded-full bg-background-elevated">
                  {recentRooms.length}
                </span>
              </h3>
              <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-secondary" />
                <span>Saved locally in your browser. Absolutely no account required.</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClearAll}
            className="text-xs text-text-dim hover:text-status-error flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentRooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => handleRejoin(room.roomId)}
              className="group bg-background-primary/80 hover:bg-background-elevated border border-surface-border hover:border-accent-primary/50 rounded-2xl p-4 transition-all cursor-pointer relative shadow-sm hover:shadow-glow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-accent-secondary transition-colors truncate">
                    {room.roomName}
                  </h4>
                  <button
                    onClick={(e) => handleRemove(room.roomId, e)}
                    className="p-1 text-text-dim hover:text-status-error opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-text-dim mb-3">
                  <span className="text-accent-secondary font-semibold">{room.roomId}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(room.joinedAt || room.lastVisited)}</span>
                </div>

                {room.mediaTitle && (
                  <p className="text-xs text-text-muted flex items-center gap-1.5 truncate mb-4">
                    <Film className="w-3 h-3 text-accent-secondary flex-shrink-0" />
                    <span className="truncate">{room.mediaTitle}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-xs">
                <span className="text-accent-secondary font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <Play className="w-3 h-3 fill-accent-secondary" />
                  <span>Rejoin Party</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-dim group-hover:text-accent-secondary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
