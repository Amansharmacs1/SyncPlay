import React from 'react';
import { Users, LogIn, ArrowRight } from 'lucide-react';
import { WatchRoomPreview } from './WatchRoomPreview.js';

interface HeroSectionProps {
  onCreateRoomClick: () => void;
  onJoinRoomClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCreateRoomClick,
  onJoinRoomClick,
}) => {
  return (
    <section id="hero" className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Top ambient radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] purple-gradient-glow pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Release / Status badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-surface-border bg-background-card/80 text-xs font-medium text-accent-secondary mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-status-success animate-pulse" />
          <span>SyncPlay v1.0 • Real-Time Social Streaming</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          Good moments are <br />
          <span className="text-gradient">better together.</span>
        </h1>

        {/* Supporting Text */}
        <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Watch your favorite videos together, share reactions, and stay connected with friends —
          wherever life takes you.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onCreateRoomClick}
            className="w-full sm:w-auto accent-gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-base shadow-glow flex items-center justify-center gap-2.5 group"
          >
            <Users className="w-5 h-5" />
            <span>Create a Room</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onJoinRoomClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-text-main font-semibold text-base border border-surface-border bg-background-card/80 hover:bg-background-elevated hover:border-text-dim transition-all flex items-center justify-center gap-2.5"
          >
            <LogIn className="w-5 h-5 text-text-muted" />
            <span>Join a Room</span>
          </button>
        </div>

        {/* Watch Room Preview */}
        <WatchRoomPreview />
      </div>
    </section>
  );
};
