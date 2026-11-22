import React from 'react';
import { useCallStore } from '../../stores/useCallStore.js';
import { webrtcManager } from '../../services/webrtc/WebRTCManager.js';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Settings,
  PhoneOff,
} from 'lucide-react';

interface CallToolbarProps {
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
  isChatOpen?: boolean;
  isParticipantsOpen?: boolean;
}

export const CallToolbar: React.FC<CallToolbarProps> = () => {
  const {
    isInCall,
    isJoining,
    cameraEnabled,
    microphoneEnabled,
    isScreenSharing,
    setPreJoinModalOpen,
    setDeviceSettingsModalOpen,
  } = useCallStore();

  // If not currently in call, show clean Apple banner to join call
  if (!isInCall) {
    return (
      <div className="w-full apple-card p-3 sm:p-4 flex items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3] flex-shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">
              Live Voice & Video
            </div>
            <div className="text-xs text-[#86868B]">
              Talk face-to-face with everyone in the room
            </div>
          </div>
        </div>

        <button
          onClick={() => setPreJoinModalOpen(true)}
          disabled={isJoining}
          className="apple-btn-primary px-5 py-2 text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
        >
          <Video className="w-4 h-4" />
          <span>{isJoining ? 'Joining...' : 'Join Call'}</span>
        </button>
      </div>
    );
  }

  // Floating FaceTime-style controls
  return (
    <div className="w-full flex items-center justify-center py-2">
      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-[#D2D2D7]/70 shadow-apple-float">
        {/* Mic Toggle */}
        <button
          onClick={() => webrtcManager.toggleMicrophone()}
          title={microphoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            microphoneEnabled
              ? 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
              : 'bg-[#FF3B30] text-white shadow-sm'
          }`}
        >
          {microphoneEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => webrtcManager.toggleCamera()}
          title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            cameraEnabled
              ? 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
              : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-[#FF3B30]" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={() => webrtcManager.toggleScreenShare()}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isScreenSharing
              ? 'bg-[#0071E3] text-white shadow-sm'
              : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
          }`}
        >
          {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </button>

        {/* Device Settings */}
        <button
          onClick={() => setDeviceSettingsModalOpen(true)}
          title="Audio & Video Settings"
          className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-[#D2D2D7]/60" />

        {/* Leave Call (FaceTime Red Pill) */}
        <button
          onClick={() => webrtcManager.leaveCall()}
          title="Leave Call"
          className="px-4 h-10 rounded-full bg-[#FF3B30] hover:bg-[#E02E24] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Leave Call</span>
        </button>
      </div>
    </div>
  );
};
