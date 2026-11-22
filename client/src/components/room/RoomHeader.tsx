import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Share2, Film, Users, LogOut, Shield } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { ConnectionIndicator } from '../common/ConnectionIndicator.js';

interface RoomHeaderProps {
  onOpenInvite: () => void;
  onOpenMediaSelect: () => void;
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  onOpenInvite,
  onOpenMediaSelect,
  onLeaveRoom,
}) => {
  const { room, isHost, connectionStatus } = useRoomStore();

  if (!room) return null;

  return (
    <div className="w-full bg-background-secondary/90 border-b border-surface-border backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Room Info */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <span className="text-base font-bold text-white hidden sm:inline-block">
              Sync<span className="text-accent-secondary">Play</span>
            </span>
          </Link>

          <div className="h-5 w-px bg-surface-border hidden sm:block" />

          {/* Room Title & Code */}
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white max-w-[160px] sm:max-w-[240px] truncate">
                  {room.roomName}
                </h1>
                {room.hasPassword && (
                  <span title="Password Protected">
                    <Shield className="w-3.5 h-3.5 text-accent-secondary" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                <span>ID: {room.roomId}</span>
                <span className="text-text-dim">•</span>
                <ConnectionIndicator status={connectionStatus} showText={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Change Media Button (Host Only) */}
          {isHost && (
            <button
              onClick={onOpenMediaSelect}
              className="px-3 py-1.5 rounded-xl border border-accent-primary/40 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-secondary text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Change Video</span>
            </button>
          )}

          {/* Invite Button */}
          <button
            onClick={onOpenInvite}
            className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-background-hover border border-surface-border text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-accent-secondary" />
            <span>Invite</span>
          </button>

          {/* Participant count pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background-card border border-surface-border text-xs text-text-muted">
            <Users className="w-3.5 h-3.5 text-accent-secondary" />
            <span>{room.participants.length}</span>
          </div>

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            title="Leave Room"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-text-muted hover:text-status-error hover:bg-status-error/10 border border-transparent hover:border-status-error/20 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
