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
  const canControl = isHost || Boolean(room?.allowParticipantControl);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply authoritative playback state
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

    if (state.status === 'playing' && video.paused) {
      isInternalSyncRef.current = true;
      video.play().catch((err) => {
        console.warn('Autoplay with audio blocked; trying muted:', err);
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    } else if (state.status === 'paused' && !video.paused) {
      isInternalSyncRef.current = true;
      video.pause();
    }
  }, []);

  // Sync state changes from store
  useEffect(() => {
    if (room?.playbackState && !isLoading) {
      applyPlaybackState(room.playbackState);
    }
  }, [room?.playbackState, isLoading, applyPlaybackState]);

  // Event listeners on native video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
      video.volume = volume;

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
      if (canControl) {
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
      if (canControl) {
        socketService.pause(video.currentTime);
      } else if (room?.playbackState.status === 'playing') {
        isInternalSyncRef.current = true;
        video.play().catch(() => {});
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (isHost) {
        socketService.reportPlaybackEnded();
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
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onError);
    };
  }, [isHost, canControl, room?.playbackState, applyPlaybackState, volume]);

  // Controls Handlers
  const handlePlayToggle = () => {
    if (!canControl || !videoRef.current) return;
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
    if (!canControl || !videoRef.current) return;
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
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
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
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
        />

        {/* Loading overlay */}
        {isLoading && !errorMessage && (
          <div className="absolute inset-0 bg-background-primary flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-accent-secondary animate-spin" />
            <span className="text-sm text-text-muted font-medium">Loading Video Stream...</span>
          </div>
        )}

        {/* Error overlay */}
        {errorMessage && (
          <div className="absolute inset-0 bg-background-primary/95 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-status-error mb-3" />
            <h4 className="text-base font-semibold text-white mb-1">Playback Error</h4>
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
        allowParticipantControl={room?.allowParticipantControl}
        onPlayToggle={handlePlayToggle}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onFullscreenToggle={handleFullscreenToggle}
      />
    </div>
  );
};
