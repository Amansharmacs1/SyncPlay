import React, { useRef, useEffect, useState } from 'react';
import { useCallStore } from '../../stores/useCallStore.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { webrtcManager } from '../../services/webrtc/WebRTCManager.js';
import {
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Tv,
  Film,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ScreenShareStageProps {
  onSwitchToMedia?: () => void;
}

export const ScreenShareStage: React.FC<ScreenShareStageProps> = ({ onSwitchToMedia }) => {
  const {
    isScreenSharing,
    screenStream,
    callParticipants,
    activeStageView,
    setActiveStageView,
  } = useCallStore();

  const { displayName, room } = useRoomStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');

  // Detect active screen share (local or remote)
  let activeStream: MediaStream | null = null;
  let presenterName = '';
  let isLocalPresenter = false;

  if (isScreenSharing && screenStream) {
    activeStream = screenStream;
    presenterName = displayName || 'You';
    isLocalPresenter = true;
  } else {
    // Find remote participant who is currently sharing screen
    const remotePresenter = Array.from(callParticipants.values()).find(
      (p) => p.screenSharing && p.stream
    );
    if (remotePresenter && remotePresenter.stream) {
      activeStream = remotePresenter.stream;
      presenterName = remotePresenter.name || 'Friend';
      isLocalPresenter = false;
    }
  }

  // Bind screen stream to video element
  useEffect(() => {
    if (videoRef.current && activeStream) {
      if (videoRef.current.srcObject !== activeStream) {
        videoRef.current.srcObject = activeStream;
      }
    }
  }, [activeStream]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleStopSharing = () => {
    webrtcManager.stopScreenShare();
  };

  if (!activeStream) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-[#D2D2D7]/50 shadow-2xl flex flex-col justify-between group select-none"
    >
      {/* Top Google Meet / Zoom Presentation Header Banner */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none transition-opacity duration-300">
        {/* Presenter Info Badge */}
        <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <Monitor className={`w-4 h-4 ${isLocalPresenter ? 'text-[#34C759] animate-pulse' : 'text-[#0071E3]'}`} />
            <span className="text-xs font-semibold text-white">
              {isLocalPresenter ? 'You are presenting to everyone' : `${presenterName} is presenting`}
            </span>
          </div>
          <span className="text-[10px] text-white/60 font-medium px-1.5 py-0.5 rounded-md bg-white/10 uppercase tracking-wider">
            1080p HD
          </span>
        </div>

        {/* Top Controls: Switch to Movie & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Switch to Synchronized Video if available */}
          {room?.media && (
            <button
              onClick={() => {
                setActiveStageView('media');
                onSwitchToMedia?.();
              }}
              title="Switch to Watch Video"
              className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-[#0071E3]" />
              <span className="hidden sm:inline">Watch Video</span>
            </button>
          )}

          {/* Stop Sharing Button (for presenter) */}
          {isLocalPresenter && (
            <button
              onClick={handleStopSharing}
              className="px-3.5 py-1.5 rounded-full bg-[#FF3B30] hover:bg-[#FF453A] text-white text-xs font-medium flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <MonitorOff className="w-3.5 h-3.5" />
              <span>Stop Presenting</span>
            </button>
          )}

          {/* Fit / Fill Mode toggle */}
          <button
            onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
            title={fitMode === 'contain' ? 'Fill screen' : 'Fit to window'}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="w-full h-full flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocalPresenter}
          className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      </div>

      {/* Bottom Floating Presenter Watermark Badge */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] text-white font-medium">
          <Sparkles className="w-3 h-3 text-[#34C759]" />
          <span>Live Presentation Feed</span>
        </div>
      </div>
    </div>
  );
};
