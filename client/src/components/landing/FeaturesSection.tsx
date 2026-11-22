import React from 'react';
import { Video, ShieldCheck, Film, ListVideo, MessageSquare, Smartphone } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Apple-Style Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-xs sm:text-sm uppercase tracking-wide text-[#0071E3] font-semibold mb-2">
          Engineered for Connection
        </h2>
        <p className="text-3xl sm:text-5xl font-semibold text-[#1D1D1F] tracking-tight leading-tight">
          Everything you love about movie night. Now across distance.
        </p>
      </div>

      {/* Apple-Style Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bento 1: FaceTime Video & Audio (Span 2 cols) */}
        <div className="md:col-span-2 apple-card p-8 sm:p-10 bg-white flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3] mb-6">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0071E3] block mb-1">
              FaceTime Video & Voice
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-tight mb-3">
              Crystal-clear live calling.
            </h3>
            <p className="text-sm sm:text-base text-[#86868B] leading-relaxed max-w-lg">
              Integrated peer-to-peer WebRTC video calling lets you see every laugh, gasp, and smile. Adaptive stream bitrates ensure smooth frame rates without interrupting video playback.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-[#86868B]">
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] font-medium text-[#1D1D1F]">Adaptive HD Video</span>
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] font-medium text-[#1D1D1F]">Echo Cancellation</span>
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] font-medium text-[#1D1D1F]">Screen Sharing</span>
          </div>
        </div>

        {/* Bento 2: Zero Accounts (Span 1 col) */}
        <div className="apple-card p-8 sm:p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3] mb-6">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0071E3] block mb-1">
              Instant Access
            </span>
            <h3 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight mb-3">
              100% account‑free.
            </h3>
            <p className="text-sm text-[#86868B] leading-relaxed">
              No passwords, emails, or verification walls. Pick a display name, share your invitation link, and start watching immediately.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#D2D2D7]/40 text-xs font-medium text-[#0071E3]">
            Zero signup friction →
          </div>
        </div>

        {/* Bento 3: Frame-Accurate Sync (Span 1 col) */}
        <div className="apple-card p-8 sm:p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3] mb-6">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0071E3] block mb-1">
              Playback Engine
            </span>
            <h3 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight mb-3">
              Millisecond accuracy.
            </h3>
            <p className="text-sm text-[#86868B] leading-relaxed">
              Authoritative drift correction ensures YouTube and direct MP4/WebM streams stay perfectly locked for everyone in the room.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#D2D2D7]/40 text-xs font-medium text-[#0071E3]">
            Auto drift correction →
          </div>
        </div>

        {/* Bento 4: Collaborative Up Next Queue (Span 2 cols) */}
        <div className="md:col-span-2 apple-card p-8 sm:p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#E8F2FE] flex items-center justify-center text-[#0071E3] mb-6">
              <ListVideo className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0071E3] block mb-1">
              Collaborative Queue
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-tight mb-3">
              Up Next playlist.
            </h3>
            <p className="text-sm sm:text-base text-[#86868B] leading-relaxed max-w-lg">
              Queue upcoming videos together so the party never pauses. When one video finishes, the room automatically transitions to the next item in the queue.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-[#86868B]">
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] font-medium text-[#1D1D1F]">Auto-Advance</span>
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] font-medium text-[#1D1D1F]">Host Reordering</span>
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] font-medium text-[#1D1D1F]">Shared Playlists</span>
          </div>
        </div>
      </div>
    </section>
  );
};
