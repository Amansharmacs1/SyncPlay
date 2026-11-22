import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoomStore } from '../stores/useRoomStore.js';
import { useCallStore } from '../stores/useCallStore.js';
import { socketService } from '../services/socket.js';
import { webrtcManager } from '../services/webrtc/WebRTCManager.js';
import { api } from '../services/api.js';
import { RoomHeader } from '../components/room/RoomHeader.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { ChatPanel } from '../components/chat/ChatPanel.js';
import { ParticipantList } from '../components/participants/ParticipantList.js';
import { InviteModal } from '../components/room/InviteModal.js';
import { MediaSelectModal } from '../components/room/MediaSelectModal.js';
import { VideoGrid } from '../components/call/VideoGrid.js';
import { CallToolbar } from '../components/call/CallToolbar.js';
import { PreJoinCallModal } from '../components/call/PreJoinCallModal.js';
import { DeviceSettingsModal } from '../components/call/DeviceSettingsModal.js';
import { MessageSquare, Users, Loader2, AlertCircle, KeyRound, LogIn } from 'lucide-react';

export const WatchRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    room,
    displayName,
    setDisplayName,
    participantId,
    connectionStatus,
    errorMessage,
    resetRoom,
  } = useRoomStore();

  const { isInCall } = useCallStore();

  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMediaSelectOpen, setIsMediaSelectOpen] = useState(false);

  // Direct joining state (for users arriving via direct link)
  const [needsJoinInfo, setNeedsJoinInfo] = useState(false);
  const [inputName, setInputName] = useState(displayName);
  const [inputPassword, setInputPassword] = useState(searchParams.get('pwd') || '');
  const [roomHasPassword, setRoomHasPassword] = useState(false);
  const [isCheckingRoom, setIsCheckingRoom] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);

  const normRoomId = (roomId || '').toUpperCase();

  // Step 1: Check room existence and password requirements
  useEffect(() => {
    let isCancelled = false;

    async function checkRoom() {
      if (!normRoomId) {
        navigate('/');
        return;
      }

      setIsCheckingRoom(true);
      try {
        const info = await api.getRoom(normRoomId);
        if (isCancelled) return;
        setRoomHasPassword(info.hasPassword);

        // If user already has a display name and room has no password or password was passed via query
        if (displayName && (!info.hasPassword || searchParams.get('pwd'))) {
          setNeedsJoinInfo(false);
          socketService.joinRoom(
            normRoomId,
            participantId,
            displayName,
            searchParams.get('pwd') || undefined
          );
        } else {
          setNeedsJoinInfo(true);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setJoinError(err.message || 'Room not found or expired.');
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingRoom(false);
        }
      }
    }

    checkRoom();

    return () => {
      isCancelled = true;
    };
  }, [normRoomId, displayName, participantId, navigate, searchParams]);

  // Handle direct join submission
  const handleDirectJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = inputName.trim();
    if (!cleanName) {
      setJoinError('Please enter your display name.');
      return;
    }

    setDisplayName(cleanName);
    setNeedsJoinInfo(false);
    setJoinError(null);

    socketService.joinRoom(
      normRoomId,
      participantId,
      cleanName,
      inputPassword.trim() || undefined
    );
  };

  const handleLeaveRoom = () => {
    webrtcManager.leaveCall();
    socketService.leaveRoom();
    resetRoom();
    navigate('/');
  };

  // If loading room details
  if (isCheckingRoom) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-accent-secondary animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-white">Connecting to Watch Room...</h3>
        <p className="text-sm text-text-muted mt-1 font-mono">Room ID: {normRoomId}</p>
      </div>
    );
  }

  // If user needs to enter display name / password before entering
  if (needsJoinInfo) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-background-card border border-surface-border rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-xs font-mono text-accent-secondary mb-3">
              Room: {normRoomId}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Join Watch Party</h2>
            <p className="text-xs text-text-muted mt-1">
              Enter your name to join your friends in this room.
            </p>
          </div>

          {joinError && (
            <div className="p-3 mb-4 text-xs text-status-error bg-status-error/10 border border-status-error/20 rounded-xl">
              {joinError}
            </div>
          )}

          <form onSubmit={handleDirectJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Display Name <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="e.g. Taylor"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-background-primary border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            {roomHasPassword && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-accent-secondary" />
                  <span>Room Password <span className="text-status-error">*</span></span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter room password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full bg-background-primary border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full accent-gradient-btn py-3 px-4 rounded-xl text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Enter Watch Room</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If fatal error / room not found
  if (errorMessage && connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-status-error mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Room Unavailable</h3>
        <p className="text-sm text-text-muted max-w-md mb-6">{errorMessage}</p>
        <button
          onClick={() => navigate('/')}
          className="accent-gradient-btn px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-primary text-text-main">
      {/* Header */}
      <RoomHeader
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenMediaSelect={() => setIsMediaSelectOpen(true)}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Watch Room Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-5">
        {/* Left / Main Column: Video Player Area (~68%) */}
        <div className="w-full lg:w-[68%] flex flex-col gap-4">
          <VideoPlayer />

          {/* Current Media Info Card */}
          {room?.media && (
            <div className="bg-background-card border border-surface-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="truncate">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent-secondary bg-accent-primary/10 px-2 py-0.5 rounded-md border border-accent-primary/20 mr-2">
                  {room.media.type === 'youtube' ? 'YouTube' : 'Direct MP4'}
                </span>
                <span className="text-sm font-bold text-white truncate align-middle">
                  {room.media.title}
                </span>
              </div>
              <div className="text-xs text-text-muted font-mono flex-shrink-0">
                Created: {new Date(room.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Call Toolbar (Phase 2) */}
          <CallToolbar
            isChatOpen={activeTab === 'chat'}
            isParticipantsOpen={activeTab === 'participants'}
            onToggleChat={() => setActiveTab('chat')}
            onToggleParticipants={() => setActiveTab('participants')}
          />

          {/* Video Grid (when in call) */}
          {isInCall && (
            <div className="mt-2">
              <VideoGrid />
            </div>
          )}
        </div>

        {/* Right Column: Chat & Participants Panel (~32%) */}
        <div className="w-full lg:w-[32%] flex flex-col min-h-[460px] lg:h-[calc(100vh-130px)] sticky top-20">
          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-background-secondary border border-surface-border rounded-xl mb-3 flex-shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'chat'
                  ? 'bg-background-card text-white shadow-sm border border-surface-border'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-accent-secondary" />
              <span>Live Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'participants'
                  ? 'bg-background-card text-white shadow-sm border border-surface-border'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-accent-secondary" />
              <span>People ({room?.participants.length || 0})</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 min-h-0">
            {activeTab === 'chat' ? <ChatPanel /> : <ParticipantList />}
          </div>
        </div>
      </div>

      {/* Modals */}
      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <MediaSelectModal
        isOpen={isMediaSelectOpen}
        onClose={() => setIsMediaSelectOpen(false)}
      />
      <PreJoinCallModal />
      <DeviceSettingsModal />
    </div>
  );
};
