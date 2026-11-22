import React from 'react';
import { Play, Volume2, Video, Mic } from 'lucide-react';
import { Avatar } from '../common/Avatar.js';

export const WatchRoomPreview: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      {/* Apple-Style macOS SharePlay Window Frame */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#D2D2D7]/70 bg-white shadow-apple-float overflow-hidden">
        {/* macOS Window Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D2D2D7]/50 bg-[#F5F5F7]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block shadow-xs" />
            <span className="ml-3 text-xs text-[#86868B] font-medium hidden sm:inline">
              SyncPlay — Movie Night
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#0071E3] bg-[#E8F2FE] px-2.5 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            <span>FaceTime & Stream Synced</span>
          </div>
        </div>

        {/* Video & SharePlay Viewport */}
        <div className="relative aspect-video w-full bg-slate-950 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
          {/* Cinematic Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center">
            {/* Center Play Indicator */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1 opacity-90" />
            </div>
          </div>

          {/* Top Left: Video Title Pill */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs text-white font-medium">
              4K Cinematic • Direct Sync
            </div>

            {/* Top Right: Floating FaceTime Video Tiles */}
            <div className="flex items-center gap-2">
              {/* Tile 1 */}
              <div className="w-20 sm:w-28 aspect-video rounded-xl sm:rounded-2xl bg-slate-800/90 border border-white/20 shadow-xl overflow-hidden relative flex items-center justify-center">
                <Avatar name="Sarah" size="sm" />
                <div className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[9px] text-white bg-black/60 px-1.5 py-0.2 rounded-md">
                  <Mic className="w-2.5 h-2.5 text-[#34C759]" />
                  <span>Sarah</span>
                </div>
              </div>

              {/* Tile 2 */}
              <div className="w-20 sm:w-28 aspect-video rounded-xl sm:rounded-2xl bg-slate-800/90 border border-[#0071E3] shadow-xl overflow-hidden relative flex items-center justify-center">
                <Avatar name="Alex" size="sm" />
                <div className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[9px] text-white bg-black/60 px-1.5 py-0.2 rounded-md">
                  <Video className="w-2.5 h-2.5 text-[#0071E3]" />
                  <span>Alex</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom QuickTime-Style Scrubber Bar */}
          <div className="relative z-10 mt-auto bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
            {/* Progress line */}
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0071E3] h-full w-[42%]" />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <Volume2 className="w-3.5 h-3.5 text-white/80" />
                <span className="font-mono text-[11px] text-white/90">04:22 / 12:45</span>
              </div>
              <span className="text-[11px] text-white/80 font-medium">
                Frame-accurate sync for everyone
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
