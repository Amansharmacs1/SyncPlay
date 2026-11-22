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
    <div className="w-full bg-white border border-surface-border rounded-2xl p-3 sm:p-4 shadow-card">
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
          className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer transition-all ${
            hasControl ? 'accent-accent-primary hover:h-2.5' : 'cursor-not-allowed opacity-80'
          }`}
          style={{
            background: `linear-gradient(to right, #6366F1 ${progressPercent}%, #E2E8F0 ${progressPercent}%)`,
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
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              hasControl
                ? 'accent-gradient-btn text-white shadow-glow'
                : 'bg-slate-100 text-text-dim cursor-not-allowed'
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
              className="p-1 text-text-muted hover:text-text-main transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-status-error" />
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
              className="hidden sm:block w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
          </div>

          {/* Time Display */}
          <div className="text-xs font-mono text-text-muted">
            <span className="text-text-main font-semibold">{formatTime(displayTime)}</span>
            <span className="mx-1 text-text-dim">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Sync Status & Fullscreen */}
        <div className="flex items-center gap-3">
          {/* Sync badge */}
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 border border-surface-border">
            {isHost ? (
              <>
                <Radio className="w-3.5 h-3.5 text-accent-primary animate-pulse" />
                <span className="text-accent-secondary hidden sm:inline">You are Host</span>
              </>
            ) : allowParticipantControl ? (
              <>
                <Radio className="w-3.5 h-3.5 text-accent-primary" />
                <span className="text-accent-secondary hidden sm:inline">Shared Control</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-text-dim" />
                <span className="text-text-muted hidden sm:inline">Synced to Host</span>
              </>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={onFullscreenToggle}
            className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-slate-100 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
