import React, { useRef, useEffect } from 'react';
import { ParticipantCallState } from '../../services/webrtc/types.js';
import { Avatar } from '../common/Avatar.js';
import {
  MicOff,
  VideoOff,
  Monitor,
  Maximize2,
  Minimize2,
  Wifi,
} from 'lucide-react';

interface ParticipantTileProps {
  participant: ParticipantCallState;
  isFocused?: boolean;
  onToggleFocus?: () => void;
  className?: string;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  isFocused = false,
  onToggleFocus,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Attach MediaStream to video and audio elements
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      if (videoRef.current.srcObject !== participant.stream) {
        videoRef.current.srcObject = participant.stream;
      }
    }
  }, [participant.stream]);

  // Remote audio stream management
  useEffect(() => {
    if (audioRef.current && participant.stream && !participant.isLocal) {
      if (audioRef.current.srcObject !== participant.stream) {
        audioRef.current.srcObject = participant.stream;
        audioRef.current.play().catch((err) => {
          console.warn('[ParticipantTile] Remote audio play blocked by autoplay policy:', err);
        });
      }
    }
  }, [participant.stream, participant.isLocal]);

  const hasVideo =
    !!participant.stream &&
    participant.cameraEnabled &&
    participant.stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');

  const isSpeaking = participant.audioLevel > 0.15 && participant.microphoneEnabled;

  const qualityColor = {
    excellent: 'text-status-success',
    good: 'text-status-warning',
    poor: 'text-status-error',
    reconnecting: 'text-status-error animate-pulse',
  }[participant.connectionQuality];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-300 group flex items-center justify-center select-none ${
        isSpeaking
          ? 'ring-2 ring-[#34C759] shadow-md'
          : 'border-[#D2D2D7]/50 shadow-sm'
      } ${className}`}
    >
      {/* Remote audio playback element (hidden, unmuted) */}
      {!participant.isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal} // Always mute local video preview to avoid echo
          className={`w-full h-full object-cover ${participant.isLocal && !participant.screenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Camera Off Fallback: Generated Initials Avatar */
        <div className="flex flex-col items-center justify-center p-4">
          <Avatar name={participant.name} size={isFocused ? 'lg' : 'md'} className="mb-2" />
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <VideoOff className="w-3 h-3" /> Camera off
          </span>
        </div>
      )}

      {/* Top Overlay Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        {/* Name and Screen share badge */}
        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 max-w-[70%]">
          <span className="text-xs font-medium text-white truncate">
            {participant.name} {participant.isLocal ? '(You)' : ''}
          </span>
          {participant.screenSharing && (
            <span title="Screen Sharing" className="flex items-center text-[#0071E3]">
              <Monitor className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Quality indicator & Focus Button */}
        <div className="flex items-center gap-1 pointer-events-auto">
          {/* Connection quality */}
          <span
            title={`Connection: ${participant.connectionQuality}`}
            className={`p-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 ${qualityColor}`}
          >
            <Wifi className="w-3 h-3" />
          </span>

          {/* Pin/Focus toggle */}
          {onToggleFocus && (
            <button
              onClick={onToggleFocus}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition-colors"
              title={isFocused ? 'Unfocus' : 'Focus'}
            >
              {isFocused ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Status Overlay */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
        {/* Mic muted indicator */}
        {!participant.microphoneEnabled ? (
          <span className="p-1.5 rounded-full bg-[#FF3B30] text-white backdrop-blur-md shadow-sm">
            <MicOff className="w-3 h-3" />
          </span>
        ) : isSpeaking ? (
          /* Speaking wave indicator */
          <span className="px-2.5 py-0.5 rounded-full bg-[#34C759] text-white text-[10px] font-medium backdrop-blur-md animate-pulse">
            Speaking
          </span>
        ) : null}
      </div>
    </div>
  );
};
