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
  onPlayToggle,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
}) => {
  const [isSeekingLocal, setIsSeekingLocal] = useState(false);
  const [seekValue, setSeekValue] = useState(currentTime);

  const displayTime = isSeekingLocal ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost) return;
    setIsSeekingLocal(true);
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSliderCommit = () => {
    if (!isHost) return;
    setIsSeekingLocal(false);
    onSeek(seekValue);
  };

  return (
    <div className="w-full bg-background-card/95 border border-surface-border rounded-xl p-3 sm:p-4 backdrop-blur-md shadow-card">
      {/* Progress Bar */}
      <div className="relative mb-3 flex items-center group">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          disabled={!isHost}
          value={displayTime}
          onChange={handleSliderChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          className={`w-full h-1.5 bg-background-elevated rounded-lg appearance-none cursor-pointer transition-all ${
            isHost ? 'accent-accent-primary hover:h-2.5' : 'cursor-not-allowed opacity-80'
          }`}
          style={{
            background: `linear-gradient(to right, #8B5CF6 ${progressPercent}%, #2A2A3C ${progressPercent}%)`,
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
            disabled={!isHost}
            title={isHost ? (isPlaying ? 'Pause' : 'Play') : 'Only host can control playback'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isHost
                ? 'accent-gradient-btn text-white shadow-glow'
                : 'bg-background-elevated text-text-dim cursor-not-allowed'
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
              className="p-1 text-text-muted hover:text-white transition-colors"
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
              className="hidden sm:block w-16 h-1 bg-surface-border rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
          </div>

          {/* Time Display */}
          <div className="text-xs font-mono text-text-muted">
            <span className="text-white font-medium">{formatTime(displayTime)}</span>
            <span className="mx-1 text-text-dim">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Sync Status & Fullscreen */}
        <div className="flex items-center gap-3">
          {/* Sync badge */}
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-background-elevated border border-surface-border">
            {isHost ? (
              <>
                <Radio className="w-3.5 h-3.5 text-accent-secondary animate-pulse" />
                <span className="text-accent-secondary hidden sm:inline">You are Host</span>
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
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-background-elevated transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
