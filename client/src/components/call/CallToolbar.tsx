import React from 'react';
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
  Power,
  MessageSquare,
  Users,
  PhoneCall,
} from 'lucide-react';

interface CallToolbarProps {
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
  isChatOpen?: boolean;
  isParticipantsOpen?: boolean;
}

export const CallToolbar: React.FC<CallToolbarProps> = ({
  onToggleChat,
  onToggleParticipants,
  isChatOpen = true,
  isParticipantsOpen = false,
}) => {
  const {
    isInCall,
    isJoining,
    cameraEnabled,
    microphoneEnabled,
    isScreenSharing,
    setPreJoinModalOpen,
    setDeviceSettingsModalOpen,
  } = useCallStore();

  const { isHost } = useRoomStore();

  const handleEndRoom = () => {
    if (!isHost) return;
    if (confirm('Are you sure you want to end this room for all participants?')) {
      socketService.endRoom();
    }
  };

  // If not currently in call, show a "Join Video Call" action button
  if (!isInCall) {
    return (
      <div className="w-full bg-white border border-surface-border rounded-2xl p-3 shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-light border border-accent-primary/20 flex items-center justify-center text-accent-secondary">
            <PhoneCall className="w-4 h-4 text-accent-primary" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-main">Live Voice & Video</div>
            <div className="text-[11px] text-text-muted">Talk and watch together with friends</div>
          </div>
        </div>

        <button
          onClick={() => setPreJoinModalOpen(true)}
          disabled={isJoining}
          className="accent-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-glow flex items-center gap-2 disabled:opacity-50"
        >
          <Video className="w-4 h-4" />
          <span>{isJoining ? 'Joining...' : 'Join Call'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-surface-border rounded-2xl p-3 sm:p-4 shadow-card flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto">
      {/* Left / Media Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mic Toggle */}
        <button
          onClick={() => webrtcManager.toggleMicrophone()}
          title={microphoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            microphoneEnabled
              ? 'bg-slate-100 hover:bg-slate-200 text-text-main border border-surface-border'
              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
          }`}
        >
          {microphoneEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden md:inline">
            {microphoneEnabled ? 'Mute' : 'Unmuted'}
          </span>
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => webrtcManager.toggleCamera()}
          title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            cameraEnabled
              ? 'bg-slate-100 hover:bg-slate-200 text-text-main border border-surface-border'
              : 'bg-slate-100/70 hover:bg-slate-200/80 text-text-muted border border-surface-border'
          }`}
        >
          {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-status-error" />}
          <span className="hidden md:inline">
            {cameraEnabled ? 'Camera' : 'Camera Off'}
          </span>
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={() => webrtcManager.toggleScreenShare()}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            isScreenSharing
              ? 'accent-gradient-btn text-white shadow-glow'
              : 'bg-slate-100 hover:bg-slate-200 text-text-main border border-surface-border'
          }`}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-4 h-4" />
          ) : (
            <Monitor className="w-4 h-4 text-accent-secondary" />
          )}
          <span className="hidden md:inline">
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </span>
        </button>

        {/* Device Settings */}
        <button
          onClick={() => setDeviceSettingsModalOpen(true)}
          title="Audio & Video Settings"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-surface-border text-text-muted hover:text-text-main transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Right / Panel & Exit Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Chat Toggle */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            title="Toggle Live Chat"
            className={`p-2.5 rounded-xl border transition-colors ${
              isChatOpen
                ? 'bg-accent-light border-accent-primary/30 text-accent-secondary'
                : 'bg-slate-100 hover:bg-slate-200 border-surface-border text-text-muted hover:text-text-main'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}

        {/* Participants Toggle */}
        {onToggleParticipants && (
          <button
            onClick={onToggleParticipants}
            title="Toggle Participants"
            className={`p-2.5 rounded-xl border transition-colors ${
              isParticipantsOpen
                ? 'bg-accent-light border-accent-primary/30 text-accent-secondary'
                : 'bg-slate-100 hover:bg-slate-200 border-surface-border text-text-muted hover:text-text-main'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* Leave Call Button */}
        <button
          onClick={() => webrtcManager.leaveCall()}
          title="Leave Call (Remain in Room)"
          className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Leave Call</span>
        </button>

        {/* Host End Room Button */}
        {isHost && (
          <button
            onClick={handleEndRoom}
            title="End Watch Party Room"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-surface-border text-text-muted transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
