import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoomStore } from '../stores/useRoomStore.js';
import { useCallStore } from '../stores/useCallStore.js';
import { socketService } from '../services/socket.js';
import { webrtcManager } from '../services/webrtc/WebRTCManager.js';
import { api } from '../services/api.js';
import { recentRoomsService } from '../services/recentRooms.js';
import { RoomHeader } from '../components/room/RoomHeader.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { ChatPanel } from '../components/chat/ChatPanel.js';
import { ParticipantList } from '../components/participants/ParticipantList.js';
import { WatchQueuePanel } from '../components/room/WatchQueuePanel.js';
import { RoomSettingsModal } from '../components/room/RoomSettingsModal.js';
import { InviteModal } from '../components/room/InviteModal.js';
import { MediaSelectModal } from '../components/room/MediaSelectModal.js';
import { VideoGrid } from '../components/call/VideoGrid.js';
import { CallToolbar } from '../components/call/CallToolbar.js';
import { PreJoinCallModal } from '../components/call/PreJoinCallModal.js';
import { DeviceSettingsModal } from '../components/call/DeviceSettingsModal.js';
import { Modal } from '../components/common/Modal.js';
import {
  MessageSquare,
  Users,
  ListVideo,
  Loader2,
  AlertCircle,
  KeyRound,
  LogIn,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

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
    unreadMessageCount,
    resetUnreadCount,
    resetRoom,
    isHost,
  } = useRoomStore();

  const { isInCall } = useCallStore();

  const [activeTab, setActiveTab] = useState<'chat' | 'queue' | 'participants'>('chat');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMediaSelectOpen, setIsMediaSelectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Direct joining state (for users arriving via direct link)
  const [needsJoinInfo, setNeedsJoinInfo] = useState(false);
  const [inputName, setInputName] = useState(displayName);
  const [inputPassword, setInputPassword] = useState(searchParams.get('pwd') || '');
  const [roomHasPassword, setRoomHasPassword] = useState(false);
  const [isCheckingRoom, setIsCheckingRoom] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);

  const normRoomId = (roomId || '').toUpperCase();

  // Save room to browser local history whenever room is loaded
  useEffect(() => {
    if (room && room.roomId) {
      recentRoomsService.saveRecentRoom({
        roomId: room.roomId,
        roomName: room.roomName,
        joinedAt: Date.now(),
        mediaTitle: room.media?.title,
      });
    }
  }, [room?.roomId, room?.roomName, room?.media?.title]);

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

  const handleTabSwitch = (tab: 'chat' | 'queue' | 'participants') => {
    setActiveTab(tab);
    if (tab === 'chat') {
      resetUnreadCount();
    }
  };

  const executeLeave = () => {
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
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={() => setIsLeaveModalOpen(true)}
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
            onToggleChat={() => handleTabSwitch('chat')}
            onToggleParticipants={() => handleTabSwitch('participants')}
          />

          {/* Video Grid (when in call) */}
          {isInCall && (
            <div className="mt-2">
              <VideoGrid />
            </div>
          )}
        </div>

        {/* Right Column: Chat, Queue & Participants Panel (~32%) */}
        <div className="w-full lg:w-[32%] flex flex-col min-h-[480px] lg:h-[calc(100vh-130px)] sticky top-20">
          {/* 3-Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-background-secondary border border-surface-border rounded-xl mb-3 flex-shrink-0">
            {/* Tab 1: Live Chat */}
            <button
              onClick={() => handleTabSwitch('chat')}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all relative ${
                activeTab === 'chat'
                  ? 'bg-background-card text-white shadow-sm border border-surface-border'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-accent-secondary" />
              <span>Chat</span>
              {activeTab !== 'chat' && unreadMessageCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-primary text-[10px] font-bold text-white animate-pulse">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </button>

            {/* Tab 2: Watch Queue */}
            <button
              onClick={() => handleTabSwitch('queue')}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'queue'
                  ? 'bg-background-card text-white shadow-sm border border-surface-border'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <ListVideo className="w-3.5 h-3.5 text-accent-secondary" />
              <span>Queue</span>
              {Boolean(room?.queue && room.queue.length > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-primary/20 text-accent-secondary text-[10px] font-medium border border-accent-primary/30">
                  {room!.queue.length}
                </span>
              )}
            </button>

            {/* Tab 3: People */}
            <button
              onClick={() => handleTabSwitch('participants')}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
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
            {activeTab === 'chat' && <ChatPanel />}
            {activeTab === 'queue' && <WatchQueuePanel />}
            {activeTab === 'participants' && <ParticipantList />}
          </div>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Leave Watch Room?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-status-warning/10 border border-status-warning/20 text-xs text-status-warning">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              {isHost
                ? 'You are the host. If you leave, another participant will be promoted to host, or the room will close if empty.'
                : 'Are you sure you want to leave this watch party? You can always rejoin using your room code.'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-background-elevated hover:bg-background-hover border border-surface-border text-xs font-medium text-white transition-colors"
            >
              Stay in Room
            </button>
            <button
              onClick={executeLeave}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-status-error/80 hover:bg-status-error text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modals */}
      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <MediaSelectModal
        isOpen={isMediaSelectOpen}
        onClose={() => setIsMediaSelectOpen(false)}
      />
      <RoomSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <PreJoinCallModal />
      <DeviceSettingsModal />
    </div>
  );
};
