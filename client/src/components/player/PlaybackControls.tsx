import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Radio,
  Lock,
} from 'lucide-react';
import { formatTime } from '../../utils/urlHelper.js';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isHost: boolean;
  allowParticipantControl?: boolean;
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  isHost,
  allowParticipantControl = false,
  onPlayToggle,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
}) => {
  const [isSeekingLocal, setIsSeekingLocal] = useState(false);
  const [seekValue, setSeekValue] = useState(currentTime);

  const hasControl = isHost || allowParticipantControl;
  const displayTime = isSeekingLocal ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasControl) return;
    setIsSeekingLocal(true);
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSliderCommit = () => {
    if (!hasControl) return;
    setIsSeekingLocal(false);
    onSeek(seekValue);
  };

  return (
    <div className="w-full apple-card p-3 sm:p-4 bg-white">
      {/* Progress Bar */}
      <div className="relative mb-3 flex items-center group">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          disabled={!hasControl}
          value={displayTime}
          onChange={handleSliderChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          className={`w-full h-1.5 bg-[#E5E5E7] rounded-full appearance-none cursor-pointer transition-all ${
            hasControl ? 'accent-[#0071E3] hover:h-2' : 'cursor-not-allowed opacity-70'
          }`}
          style={{
            background: `linear-gradient(to right, #0071E3 ${progressPercent}%, #E5E5E7 ${progressPercent}%)`,
          }}
        />
      </div>

      {/* Buttons & Time Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Play/Pause, Volume, Timers */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={onPlayToggle}
            disabled={!hasControl}
            title={hasControl ? (isPlaying ? 'Pause' : 'Play') : 'Playback control locked to host'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              hasControl
                ? 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-[#86868B] cursor-not-allowed'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMuteToggle}
              className="p-1 text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#FF3B30]" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="hidden sm:block w-16 h-1 bg-[#E5E5E7] rounded-full appearance-none cursor-pointer accent-[#0071E3]"
            />
          </div>

          {/* Time Display */}
          <div className="text-xs font-mono text-[#86868B]">
            <span className="text-[#1D1D1F] font-medium">{formatTime(displayTime)}</span>
            <span className="mx-1 text-[#A1A1A6]">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Sync Status & Fullscreen */}
        <div className="flex items-center gap-2.5">
          {/* Sync badge */}
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#F5F5F7] border border-[#D2D2D7]/50">
            {isHost ? (
              <>
                <Radio className="w-3.5 h-3.5 text-[#0071E3] animate-pulse" />
                <span className="text-[#0071E3] hidden sm:inline">Host Controlling</span>
              </>
            ) : allowParticipantControl ? (
              <>
                <Radio className="w-3.5 h-3.5 text-[#0071E3]" />
                <span className="text-[#0071E3] hidden sm:inline">Shared Control</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-[#86868B]" />
                <span className="text-[#86868B] hidden sm:inline">Synced</span>
              </>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={onFullscreenToggle}
            className="p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
