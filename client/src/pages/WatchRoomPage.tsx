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
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[#0071E3] animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-[#1D1D1F]">Connecting to Watch Room...</h3>
        <p className="text-sm text-[#86868B] mt-1 font-mono">Room ID: {normRoomId}</p>
      </div>
    );
  }

  // If user needs to enter display name / password before entering
  if (needsJoinInfo) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full apple-card p-6 sm:p-8 bg-white">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E8F2FE] text-xs font-mono font-medium text-[#0071E3] mb-3">
              Room: {normRoomId}
            </span>
            <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Join Watch Party</h2>
            <p className="text-xs text-[#86868B] mt-1">
              Enter your name to join your friends in this room.
            </p>
          </div>

          {joinError && (
            <div className="p-3 mb-4 text-xs text-[#FF3B30] bg-[#FFF2F0] border border-[#FF3B30]/20 rounded-xl">
              {joinError}
            </div>
          )}

          <form onSubmit={handleDirectJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
                Display Name <span className="text-[#FF3B30]">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="e.g. Taylor"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3] focus:bg-white transition-colors"
              />
            </div>

            {roomHasPassword && (
              <div>
                <label className="block text-xs font-semibold text-[#86868B] mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>Room Password <span className="text-[#FF3B30]">*</span></span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter room password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3] focus:bg-white transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full apple-btn-primary py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-[#FF3B30] mb-4" />
        <h3 className="text-xl font-bold text-[#1D1D1F] mb-2">Room Unavailable</h3>
        <p className="text-sm text-[#86868B] max-w-md mb-6">{errorMessage}</p>
        <button
          onClick={() => navigate('/')}
          className="apple-btn-primary px-6 py-2.5 text-sm font-medium cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
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
            <div className="apple-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="truncate flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#0071E3] bg-[#E8F2FE] px-2.5 py-0.5 rounded-full flex-shrink-0">
                  {room.media.type === 'youtube' ? 'YouTube' : 'Direct MP4'}
                </span>
                <span className="text-sm font-semibold text-[#1D1D1F] truncate align-middle">
                  {room.media.title}
                </span>
              </div>
              <div className="text-xs text-[#86868B] font-mono flex-shrink-0">
                Created {new Date(room.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Call Toolbar (FaceTime Floating Controls) */}
          <CallToolbar />

          {/* Participant Grid (Always visible for real-time presence & FaceTime) */}
          <div className="mt-2">
            <VideoGrid />
          </div>
        </div>

        {/* Right Column: Chat, Queue & Participants Panel (~32%) */}
        <div className="w-full lg:w-[32%] flex flex-col min-h-[480px] lg:h-[calc(100vh-130px)] sticky top-20">
          {/* Apple-Style Segmented Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#E8E8ED] rounded-full mb-3 flex-shrink-0">
            {/* Tab 1: Live Chat */}
            <button
              onClick={() => handleTabSwitch('chat')}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs flex items-center justify-center gap-1.5 transition-all relative cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-[#1D1D1F] shadow-sm font-medium'
                  : 'text-[#86868B] hover:text-[#1D1D1F] font-normal'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
              {activeTab !== 'chat' && unreadMessageCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#0071E3] text-[10px] font-bold text-white">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </button>

            {/* Tab 2: Watch Queue */}
            <button
              onClick={() => handleTabSwitch('queue')}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-white text-[#1D1D1F] shadow-sm font-medium'
                  : 'text-[#86868B] hover:text-[#1D1D1F] font-normal'
              }`}
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>Up Next</span>
              {Boolean(room?.queue && room.queue.length > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#E8F2FE] text-[#0071E3] text-[10px] font-medium">
                  {room!.queue.length}
                </span>
              )}
            </button>

            {/* Tab 3: People */}
            <button
              onClick={() => handleTabSwitch('participants')}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'participants'
                  ? 'bg-white text-[#1D1D1F] shadow-sm font-medium'
                  : 'text-[#86868B] hover:text-[#1D1D1F] font-normal'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
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
          <div className="p-3 rounded-2xl bg-[#FFF2F0] text-xs text-[#FF3B30] leading-relaxed">
            {isHost
              ? 'You are the host. If you leave, another participant will be promoted to host, or the room will close if empty.'
              : 'Are you sure you want to leave this watch party? You can always rejoin using your room code.'}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="w-full sm:w-auto apple-btn-secondary px-5 py-2 text-xs font-medium cursor-pointer"
            >
              Stay in Room
            </button>
            <button
              onClick={executeLeave}
              className="w-full sm:w-auto px-5 py-2 rounded-full bg-[#FF3B30] hover:bg-[#E02E24] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
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
