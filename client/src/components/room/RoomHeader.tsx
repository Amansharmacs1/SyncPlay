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
    <div className="w-full apple-nav-glass px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Room Info */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-85">
            <div className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center shadow-sm">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#1D1D1F] hidden sm:inline-block">
              SyncPlay
            </span>
          </Link>

          <div className="h-4 w-px bg-[#D2D2D7]/60 hidden sm:block" />

          {/* Room Title & Code */}
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-[#1D1D1F] max-w-[160px] sm:max-w-[240px] truncate">
                  {room.roomName}
                </h1>

                {/* Password Protection Badge */}
                {room.hasPassword && (
                  <span title="Password Protected" className="inline-flex items-center">
                    <Shield className="w-3.5 h-3.5 text-[#0071E3]" />
                  </span>
                )}

                {/* Locked Room Badge */}
                {room.isLocked && (
                  <span
                    title="Room Locked: New participants cannot join"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFF2E0] text-[#FF9500]"
                  >
                    <Lock className="w-3 h-3" />
                    <span className="hidden sm:inline">Locked</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#86868B] font-mono mt-0.5">
                <button
                  onClick={handleCopyRoomCode}
                  title="Click to copy room code"
                  className="flex items-center gap-1 hover:text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  <span className="bg-[#F5F5F7] px-2 py-0.5 rounded-full text-[11px]">ID: {room.roomId}</span>
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-[#34C759]" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                  )}
                </button>
                <span className="text-[#A1A1A6]">•</span>
                <ConnectionIndicator status={connectionStatus} showText={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Change Media Button (Host or when participant control is enabled) */}
          {(isHost || room.allowParticipantControl) && (
            <button
              onClick={onOpenMediaSelect}
              className="apple-btn-primary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Video</span>
              <span className="sm:hidden">Video</span>
            </button>
          )}

          {/* Native Share / Invite Button */}
          <button
            onClick={handleNativeShare}
            className="apple-btn-secondary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Share room invitation"
          >
            <Share2 className="w-3.5 h-3.5 text-[#0071E3]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Room Settings (Host Only) */}
          {isHost && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-full hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              title="Room Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Participant count pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F5F7] text-xs text-[#86868B] font-medium">
            <Users className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>{room.participants.length}</span>
          </div>

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            title={isHost ? "Leave or End Room" : "Leave Room"}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Leave</span>
            <LogOut className="w-3.5 h-3.5 sm:hidden" />
          </button>
        </div>
      </div>
    </div>
  );
};
