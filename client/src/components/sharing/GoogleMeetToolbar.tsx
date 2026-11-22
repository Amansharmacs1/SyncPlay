import React, { useState } from 'react';
import { useCallStore } from '../../stores/useCallStore.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { webrtcManager } from '../../services/webrtc/WebRTCManager.js';
import { socketService } from '../../services/socket.js';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Settings,
  PhoneOff,
  Layout,
  Columns,
  LayoutGrid,
  Tv,
  MessageSquare,
  Users,
  Smile,
  Sparkles,
} from 'lucide-react';

interface GoogleMeetToolbarProps {
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
  activeSidebarTab?: 'chat' | 'queue' | 'participants';
  isSidebarOpen?: boolean;
}

export const GoogleMeetToolbar: React.FC<GoogleMeetToolbarProps> = ({
  onToggleChat,
  onToggleParticipants,
  activeSidebarTab,
  isSidebarOpen = true,
}) => {
  const {
    isInCall,
    isJoining,
    cameraEnabled,
    microphoneEnabled,
    isScreenSharing,
    screenStream,
    callParticipants,
    sharingLayout,
    setSharingLayout,
    activeStageView,
    setActiveStageView,
    setPreJoinModalOpen,
    setDeviceSettingsModalOpen,
  } = useCallStore();

  const { room, participantId, displayName, unreadMessageCount } = useRoomStore();
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  // Detect if anyone is screen sharing
  const hasActiveScreenShare =
    isScreenSharing ||
    Array.from(callParticipants.values()).some((p) => p.screenSharing && p.stream);

  const handleSendReaction = (emoji: string) => {
    if (!room) return;
    socketService.sendMessage(`Reacted with ${emoji}`);
    setShowEmojiMenu(false);
  };

  // If not currently in call, show clean banner to join call
  if (!isInCall) {
    return (
      <div className="w-full apple-card p-3 sm:p-4 flex items-center justify-between gap-4 bg-white border border-[#D2D2D7]/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3] flex-shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">
              Live Voice, Video & Screen Sharing
            </div>
            <div className="text-xs text-[#86868B]">
              Join the call to share your screen and communicate with everyone
            </div>
          </div>
        </div>

        <button
          onClick={() => setPreJoinModalOpen(true)}
          disabled={isJoining}
          className="apple-btn-primary px-5 py-2 text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isJoining ? 'Joining...' : 'Join Call'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center py-2 select-none">
      {/* Floating Google Meet / Zoom Control Dock */}
      <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 rounded-full bg-white/95 backdrop-blur-2xl border border-[#D2D2D7]/70 shadow-apple-float">
        {/* 1. Microphone Toggle */}
        <button
          onClick={() => webrtcManager.toggleMicrophone()}
          title={microphoneEnabled ? 'Turn off microphone' : 'Turn on microphone'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            microphoneEnabled
              ? 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
              : 'bg-[#FF3B30] text-white shadow-sm'
          }`}
        >
          {microphoneEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* 2. Camera Toggle */}
        <button
          onClick={() => webrtcManager.toggleCamera()}
          title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            cameraEnabled
              ? 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
              : 'bg-[#FF3B30] text-white shadow-sm'
          }`}
        >
          {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        {/* 3. Screen Share (Present Now) - Google Meet signature hero button */}
        <button
          onClick={() => webrtcManager.toggleScreenShare()}
          title={isScreenSharing ? 'Stop presenting' : 'Present your screen to everyone'}
          className={`h-10 px-3.5 sm:px-4 rounded-full flex items-center gap-2 text-xs font-medium transition-all cursor-pointer ${
            isScreenSharing
              ? 'bg-[#34C759] text-white shadow-md ring-2 ring-[#34C759]/30'
              : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
          }`}
        >
          {isScreenSharing ? (
            <>
              <MonitorOff className="w-4 h-4" />
              <span className="hidden sm:inline">Stop Presenting</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 text-[#0071E3]" />
              <span className="hidden sm:inline">Present Screen</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-[#E5E5E7] mx-0.5" />

        {/* 4. Active Stage View Toggle (Movie vs Screen Share) */}
        {hasActiveScreenShare && room?.media && (
          <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-full">
            <button
              onClick={() => setActiveStageView('screenshare')}
              title="Show Screen Share on Stage"
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                activeStageView === 'screenshare'
                  ? 'bg-white text-[#0071E3] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Screen</span>
            </button>
            <button
              onClick={() => setActiveStageView('media')}
              title="Show Movie/Video on Stage"
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                activeStageView === 'media'
                  ? 'bg-white text-[#0071E3] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Video</span>
            </button>
          </div>
        )}

        {/* 5. Layout Switcher Dropdown (Zoom Side-by-Side vs Meet Filmstrip vs Grid) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowEmojiMenu(false);
            }}
            title="Change Layout (Zoom / Google Meet)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              showLayoutMenu
                ? 'bg-[#E8F2FE] text-[#0071E3]'
                : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
            }`}
          >
            <Layout className="w-4 h-4" />
          </button>

          {showLayoutMenu && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-52 p-2 bg-white rounded-2xl border border-[#D2D2D7]/70 shadow-2xl z-50 flex flex-col gap-1 text-xs">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">
                Meeting Layout
              </div>
              <button
                onClick={() => {
                  setSharingLayout('side-by-side');
                  setShowLayoutMenu(false);
                }}
                className={`p-2 rounded-xl text-left flex items-center gap-2 cursor-pointer transition-colors ${
                  sharingLayout === 'side-by-side'
                    ? 'bg-[#E8F2FE] text-[#0071E3] font-medium'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
              >
                <Columns className="w-4 h-4 text-[#0071E3]" />
                <div>
                  <div>Side-by-Side (Zoom)</div>
                  <div className="text-[10px] text-[#86868B]">Stage on left, tiles on right</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSharingLayout('filmstrip');
                  setShowLayoutMenu(false);
                }}
                className={`p-2 rounded-xl text-left flex items-center gap-2 cursor-pointer transition-colors ${
                  sharingLayout === 'filmstrip'
                    ? 'bg-[#E8F2FE] text-[#0071E3] font-medium'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
              >
                <Layout className="w-4 h-4 text-[#0071E3]" />
                <div>
                  <div>Speaker & Strip (Meet)</div>
                  <div className="text-[10px] text-[#86868B]">Hero stage, strip below</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSharingLayout('grid');
                  setShowLayoutMenu(false);
                }}
                className={`p-2 rounded-xl text-left flex items-center gap-2 cursor-pointer transition-colors ${
                  sharingLayout === 'grid'
                    ? 'bg-[#E8F2FE] text-[#0071E3] font-medium'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-[#0071E3]" />
                <div>
                  <div>Tiled Gallery (All Tiles)</div>
                  <div className="text-[10px] text-[#86868B]">Equal size participant tiles</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 6. Quick Emoji Reactions (Google Meet style) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowEmojiMenu(!showEmojiMenu);
              setShowLayoutMenu(false);
            }}
            title="Send Reaction"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              showEmojiMenu
                ? 'bg-[#E8F2FE] text-[#0071E3]'
                : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
            }`}
          >
            <Smile className="w-4 h-4" />
          </button>

          {showEmojiMenu && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-white rounded-full border border-[#D2D2D7]/70 shadow-2xl z-50 flex items-center gap-1.5">
              {['❤️', '👍', '👏', '😂', '🔥', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="w-8 h-8 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 7. Settings Gear */}
        <button
          onClick={() => setDeviceSettingsModalOpen(true)}
          title="Audio & Video Settings"
          className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-[#E5E5E7] mx-0.5" />

        {/* 8. Chat Toggle with Unread Badge */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            title="Toggle In-Call Chat"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSidebarOpen && activeSidebarTab === 'chat'
                ? 'bg-[#E8F2FE] text-[#0071E3]'
                : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0071E3] text-[9px] font-bold text-white flex items-center justify-center shadow-xs">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </button>
        )}

        {/* 9. People Toggle with Count Badge */}
        {onToggleParticipants && (
          <button
            onClick={onToggleParticipants}
            title="Toggle People List"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSidebarOpen && activeSidebarTab === 'participants'
                ? 'bg-[#E8F2FE] text-[#0071E3]'
                : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
            }`}
          >
            <Users className="w-4 h-4" />
            {room && (
              <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-full bg-[#E5E5E7] text-[9px] font-medium text-[#1D1D1F]">
                {room.participants.length}
              </span>
            )}
          </button>
        )}

        {/* 10. Leave Call Button (Red Pill) */}
        <button
          onClick={() => webrtcManager.leaveCall()}
          title="Leave Call"
          className="w-10 h-10 rounded-full bg-[#FF3B30] hover:bg-[#FF453A] text-white flex items-center justify-center transition-all shadow-sm cursor-pointer ml-1"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
