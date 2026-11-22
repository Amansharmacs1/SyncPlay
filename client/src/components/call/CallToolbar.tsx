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
      <div className="w-full bg-background-card/95 border border-surface-border rounded-2xl p-3 backdrop-blur-md shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-secondary">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Live Voice & Video</div>
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
    <div className="w-full bg-background-card/95 border border-surface-border rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-card flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto">
      {/* Left / Media Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mic Toggle */}
        <button
          onClick={() => webrtcManager.toggleMicrophone()}
          title={microphoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            microphoneEnabled
              ? 'bg-background-elevated hover:bg-background-hover text-white border border-surface-border'
              : 'bg-status-error text-white shadow-sm'
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
              ? 'bg-background-elevated hover:bg-background-hover text-white border border-surface-border'
              : 'bg-background-elevated/70 text-text-dim border border-surface-border'
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
              : 'bg-background-elevated hover:bg-background-hover text-white border border-surface-border'
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
          className="p-2.5 rounded-xl bg-background-elevated hover:bg-background-hover border border-surface-border text-text-muted hover:text-white transition-colors"
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
                ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-secondary'
                : 'bg-background-elevated hover:bg-background-hover border-surface-border text-text-muted hover:text-white'
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
                ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-secondary'
                : 'bg-background-elevated hover:bg-background-hover border-surface-border text-text-muted hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* Leave Call Button */}
        <button
          onClick={() => webrtcManager.leaveCall()}
          title="Leave Call (Remain in Room)"
          className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-status-error/20 hover:bg-status-error/30 border border-status-error/40 text-status-error text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Leave Call</span>
        </button>

        {/* Host End Room Button */}
        {isHost && (
          <button
            onClick={handleEndRoom}
            title="End Watch Party Room"
            className="p-2.5 rounded-xl bg-background-elevated hover:bg-status-error/20 hover:text-status-error border border-surface-border text-text-dim transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
