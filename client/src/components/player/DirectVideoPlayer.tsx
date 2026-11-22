import React, { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '../../services/socket.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { PlaybackState } from '../../types/index.js';
import { PlaybackControls } from './PlaybackControls.js';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DirectVideoPlayerProps {
  url: string;
}

export const DirectVideoPlayer: React.FC<DirectVideoPlayerProps> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInternalSyncRef = useRef<boolean>(false);

  const { room, isHost } = useRoomStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply authoritative playback state with drift correction
  const applyPlaybackState = useCallback((state: PlaybackState) => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    let targetTime = state.currentTime;
    if (state.status === 'playing') {
      const elapsed = (Date.now() - state.lastUpdated) / 1000;
      targetTime += elapsed * (state.playbackRate || 1);
    }

    const drift = Math.abs(video.currentTime - targetTime);
    const driftThreshold = state.status === 'playing' ? 1.5 : 0.8;

    if (drift > driftThreshold) {
      isInternalSyncRef.current = true;
      video.currentTime = targetTime;
    }

    if (state.status === 'playing') {
      setIsPlaying(true);
      if (video.paused) {
        isInternalSyncRef.current = true;
        video.play().catch((err) => {
          console.warn('[DirectVideoPlayer] Auto-play was prevented by browser:', err);
        });
      }
    } else if (state.status === 'paused') {
      setIsPlaying(false);
      if (!video.paused) {
        isInternalSyncRef.current = true;
        video.pause();
      }
    }
  }, []);

  // Sync state changes from store
  useEffect(() => {
    if (!isLoading && room?.playbackState) {
      applyPlaybackState(room.playbackState);
    }
  }, [room?.playbackState, isLoading, applyPlaybackState]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
      setErrorMessage(null);
      if (room?.playbackState) {
        applyPlaybackState(room.playbackState);
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      if (isInternalSyncRef.current) {
        isInternalSyncRef.current = false;
        return;
      }
      if (isHost) {
        socketService.play(video.currentTime);
      } else if (room?.playbackState.status === 'paused') {
        isInternalSyncRef.current = true;
        video.pause();
      }
    };

    const onPause = () => {
      setIsPlaying(false);
      if (isInternalSyncRef.current) {
        isInternalSyncRef.current = false;
        return;
      }
      if (isHost) {
        socketService.pause(video.currentTime);
      } else if (room?.playbackState.status === 'playing') {
        isInternalSyncRef.current = true;
        video.play().catch(() => {});
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const onError = () => {
      setIsLoading(false);
      setErrorMessage('Failed to load video stream. Check if URL is reachable and CORS enabled.');
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onError);
    };
  }, [isHost, room?.playbackState, applyPlaybackState]);

  // Controls Handlers
  const handlePlayToggle = () => {
    if (!isHost || !videoRef.current) return;
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
      socketService.pause(video.currentTime);
    } else {
      video.play().catch(() => {});
      socketService.play(video.currentTime);
    }
  };

  const handleSeek = (seekTime: number) => {
    if (!isHost || !videoRef.current) return;
    isInternalSyncRef.current = true;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    socketService.seek(seekTime);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      if (vol > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleFullscreenToggle = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3 w-full">
      {/* Video Viewport */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-surface-border shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          src={url}
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Loading overlay */}
        {isLoading && !errorMessage && (
          <div className="absolute inset-0 bg-background-primary flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-accent-secondary animate-spin" />
            <span className="text-sm text-text-muted font-medium">Loading Direct Video Stream...</span>
          </div>
        )}

        {/* Error overlay */}
        {errorMessage && (
          <div className="absolute inset-0 bg-background-primary/95 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-status-error mb-3" />
            <h4 className="text-base font-semibold text-white mb-1">Stream Error</h4>
            <p className="text-sm text-text-muted max-w-md">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        isHost={isHost}
        onPlayToggle={handlePlayToggle}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onFullscreenToggle={handleFullscreenToggle}
      />
    </div>
  );
};
