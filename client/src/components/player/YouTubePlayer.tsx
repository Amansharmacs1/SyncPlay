import React, { useEffect, useRef, useState, useCallback } from 'react';
import { extractYouTubeId } from '../../utils/urlHelper.js';
import { socketService } from '../../services/socket.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { PlaybackState } from '../../types/index.js';
import { PlaybackControls } from './PlaybackControls.js';
import { AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  url: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isInternalSyncRef = useRef<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { room, isHost } = useRoomStore();
  const videoId = extractYouTubeId(url);
  const canControl = isHost || Boolean(room?.allowParticipantControl);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT || !window.YT.Player) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, []);

  // Initialize YT.Player
  useEffect(() => {
    if (!videoId) {
      setErrorMessage('Invalid YouTube URL or Video ID');
      return;
    }

    setErrorMessage(null);
    let isCancelled = false;

    const initPlayer = () => {
      if (isCancelled || !containerRef.current || !window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying existing player:', e);
        }
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0, // Custom controls
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (isCancelled) return;
            setIsPlayerReady(true);
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume * 100);

            // Immediately apply current authoritative state
            if (room?.playbackState) {
              applyPlaybackState(room.playbackState);
            }
          },
          onStateChange: (event: any) => {
            if (isCancelled) return;
            handlePlayerStateChange(event.data);
          },
          onError: (event: any) => {
            console.error('[YouTubePlayer] Error code:', event.data);
            if (event.data === 100 || event.data === 101 || event.data === 150) {
              setErrorMessage('This video cannot be played in embedded mode due to YouTube restrictions.');
            } else {
              setErrorMessage('An error occurred loading this YouTube video.');
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => initPlayer();
    }

    return () => {
      isCancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
      setIsPlayerReady(false);
    };
  }, [videoId]);

  // Handle native state change from YouTube player
  const handlePlayerStateChange = useCallback(
    (stateCode: number) => {
      if (!playerRef.current) return;

      // When the state change was initiated programmatically by sync, do not emit
      if (isInternalSyncRef.current) {
        isInternalSyncRef.current = false;
        return;
      }

      const player = playerRef.current;
      const current = player.getCurrentTime ? player.getCurrentTime() : 0;

      // State codes: 0 = ENDED, 1 = PLAYING, 2 = PAUSED
      if (stateCode === 0) { // ENDED
        setIsPlaying(false);
        if (isHost) {
          socketService.reportPlaybackEnded();
        }
      } else if (stateCode === 1) { // PLAYING
        setIsPlaying(true);
        if (canControl) {
          socketService.play(current);
        } else {
          // If not permitted and trying to play while room is paused, re-sync back to host
          if (room?.playbackState.status === 'paused') {
            isInternalSyncRef.current = true;
            player.pauseVideo();
            player.seekTo(room.playbackState.currentTime, true);
          }
        }
      } else if (stateCode === 2) { // PAUSED
        setIsPlaying(false);
        if (canControl) {
          socketService.pause(current);
        } else {
          // If not permitted and trying to pause while room is playing, re-sync back to host
          if (room?.playbackState.status === 'playing') {
            isInternalSyncRef.current = true;
            player.playVideo();
          }
        }
      }
    },
    [isHost, canControl, room?.playbackState]
  );

  // Apply authoritative playback state with gentle drift correction
  const applyPlaybackState = useCallback((state: PlaybackState) => {
    if (!playerRef.current || !playerRef.current.getCurrentTime) return;

    const player = playerRef.current;
    let targetTime = state.currentTime;

    // If currently playing, compute elapsed time since lastUpdated
    if (state.status === 'playing') {
      const elapsed = (Date.now() - state.lastUpdated) / 1000;
      targetTime += elapsed * (state.playbackRate || 1);
    }

    const localTime = player.getCurrentTime();
    const drift = Math.abs(localTime - targetTime);

    // If drift is significant (> 1.8s while playing, or > 1.0s while paused)
    const driftThreshold = state.status === 'playing' ? 1.8 : 1.0;
    if (drift > driftThreshold) {
      isInternalSyncRef.current = true;
      player.seekTo(targetTime, true);
    }

    if (state.status === 'playing') {
      setIsPlaying(true);
      const playerState = player.getPlayerState();
      if (playerState !== 1) { // not PLAYING
        isInternalSyncRef.current = true;
        player.playVideo();
      }
    } else if (state.status === 'paused') {
      setIsPlaying(false);
      const playerState = player.getPlayerState();
      if (playerState === 1) { // is PLAYING
        isInternalSyncRef.current = true;
        player.pauseVideo();
      }
    }
  }, []);

  // Listen to changes in authoritative playback state from store
  useEffect(() => {
    if (isPlayerReady && room?.playbackState) {
      applyPlaybackState(room.playbackState);
    }
  }, [room?.playbackState, isPlayerReady, applyPlaybackState]);

  // Periodic local time updater
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        if (!duration && playerRef.current.getDuration) {
          setDuration(playerRef.current.getDuration());
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [duration]);

  // Controls Handlers
  const handlePlayToggle = () => {
    if (!canControl || !playerRef.current) return;
    const current = playerRef.current.getCurrentTime();
    if (isPlaying) {
      playerRef.current.pauseVideo();
      socketService.pause(current);
    } else {
      playerRef.current.playVideo();
      socketService.play(current);
    }
  };

  const handleSeek = (seekTime: number) => {
    if (!canControl || !playerRef.current) return;
    isInternalSyncRef.current = true;
    playerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
    socketService.seek(seekTime);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(vol * 100);
      if (vol > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
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
        {/* IFrame Host Container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {!isPlayerReady && !errorMessage && (
          <div className="absolute inset-0 bg-background-primary flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-accent-secondary animate-spin" />
            <span className="text-sm text-text-muted font-medium">Loading YouTube Player...</span>
          </div>
        )}

        {/* Error overlay */}
        {errorMessage && (
          <div className="absolute inset-0 bg-background-primary/95 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-status-error mb-3" />
            <h4 className="text-base font-semibold text-white mb-1">Playback Restriction</h4>
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
