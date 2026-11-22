import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Share2, Film, Users, LogOut, Shield, Settings, Lock, Check, Copy } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { useToastStore } from '../../stores/useToastStore.js';
import { ConnectionIndicator } from '../common/ConnectionIndicator.js';

interface RoomHeaderProps {
  onOpenInvite: () => void;
  onOpenMediaSelect: () => void;
  onOpenSettings?: () => void;
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  onOpenInvite,
  onOpenMediaSelect,
  onOpenSettings,
  onLeaveRoom,
}) => {
  const { room, isHost, connectionStatus } = useRoomStore();
  const { addToast } = useToastStore();
  const [copiedCode, setCopiedCode] = useState(false);

  if (!room) return null;

  const handleNativeShare = async () => {
    const inviteUrl = `${window.location.origin}/room/${room.roomId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room.roomName} on SyncPlay`,
          text: `Watch together with me on SyncPlay! Room: ${room.roomName}`,
          url: inviteUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to copy:', err);
        } else {
          return;
        }
      }
    }
    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(inviteUrl);
      addToast('Invite link copied to clipboard!', 'success');
    } catch {
      onOpenInvite();
    }
  };

  const handleCopyRoomCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.roomId);
    setCopiedCode(true);
    addToast(`Room code ${room.roomId} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

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

                {/* Password Protection Badge */}
                {room.hasPassword && (
                  <span title="Password Protected" className="inline-flex items-center">
                    <Shield className="w-3.5 h-3.5 text-accent-secondary" />
                  </span>
                )}

                {/* Locked Room Badge */}
                {room.isLocked && (
                  <span
                    title="Room Locked: New participants cannot join"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-status-warning/15 text-status-warning border border-status-warning/30"
                  >
                    <Lock className="w-3 h-3" />
                    <span className="hidden sm:inline">Locked</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted font-mono mt-0.5">
                <button
                  onClick={handleCopyRoomCode}
                  title="Click to copy room code"
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <span>ID: {room.roomId}</span>
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-status-success" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                  )}
                </button>
                <span className="text-text-dim">•</span>
                <ConnectionIndicator status={connectionStatus} showText={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Change Media Button (Host or when participant control is enabled) */}
          {(isHost || room.allowParticipantControl) && (
            <button
              onClick={onOpenMediaSelect}
              className="px-3 py-1.5 rounded-xl border border-accent-primary/40 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-secondary text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Video</span>
              <span className="sm:hidden">Video</span>
            </button>
          )}

          {/* Native Share / Invite Button */}
          <button
            onClick={handleNativeShare}
            className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-background-hover border border-surface-border text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Share room invitation"
          >
            <Share2 className="w-3.5 h-3.5 text-accent-secondary" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Room Settings (Host Only) */}
          {isHost && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-background-card hover:bg-background-elevated border border-surface-border text-text-muted hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Room Settings"
            >
              <Settings className="w-3.5 h-3.5 text-accent-secondary" />
              <span className="hidden md:inline">Settings</span>
            </button>
          )}

          {/* Participant count pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background-card border border-surface-border text-xs text-text-muted">
            <Users className="w-3.5 h-3.5 text-accent-secondary" />
            <span>{room.participants.length}</span>
          </div>

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            title={isHost ? "Leave or End Room" : "Leave Room"}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-text-muted hover:text-status-error hover:bg-status-error/10 border border-transparent hover:border-status-error/20 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHost ? 'Leave' : 'Leave'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
