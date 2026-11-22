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
    <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="apple-card p-6 sm:p-8 bg-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#D2D2D7]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                <span>Jump Back In</span>
                <span className="text-xs font-mono font-medium text-[#0071E3] px-2 py-0.5 rounded-full bg-[#E8F2FE]">
                  {recentRooms.length}
                </span>
              </h3>
              <p className="text-xs text-[#86868B] flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>Saved locally on your device. Absolutely no accounts or tracking.</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClearAll}
            className="text-xs text-[#86868B] hover:text-[#FF3B30] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recentRooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => handleRejoin(room.roomId)}
              className="group bg-[#F5F5F7] hover:bg-[#E8E8ED] border border-[#D2D2D7]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors truncate">
                    {room.roomName}
                  </h4>
                  <button
                    onClick={(e) => handleRemove(room.roomId, e)}
                    className="p-1 text-[#86868B] hover:text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-[#86868B] mb-2.5">
                  <span className="text-[#0071E3] font-medium">{room.roomId}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(room.joinedAt || room.lastVisited)}</span>
                </div>

                {room.mediaTitle && (
                  <p className="text-xs text-[#86868B] flex items-center gap-1.5 truncate mb-3">
                    <Film className="w-3 h-3 text-[#0071E3] flex-shrink-0" />
                    <span className="truncate">{room.mediaTitle}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#D2D2D7]/40 text-xs">
                <span className="text-[#0071E3] font-medium flex items-center gap-1">
                  <Play className="w-3 h-3 fill-[#0071E3]" />
                  <span>Rejoin</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#86868B] group-hover:text-[#0071E3] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
