import React from 'react';
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
    <section id="hero" className="relative pt-12 sm:pt-20 pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center">
      {/* Apple-Style Minimalist Eyebrow */}
      <div className="inline-block mb-3">
        <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-[#0071E3]">
          SyncPlay
        </span>
      </div>

      {/* Apple-Style Bold Confident Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1D1D1F] max-w-4xl mx-auto leading-[1.08] mb-5">
        Watch together. <br className="hidden sm:inline" />
        Talk together. Anywhere.
      </h1>

      {/* Clean Apple Subheadline */}
      <p className="text-base sm:text-xl text-[#86868B] max-w-2xl mx-auto font-normal leading-relaxed mb-8">
        Real-time synchronized streaming with live video calling and voice chat.
        Zero friction — no accounts, sign-ups, or apps required.
      </p>

      {/* Apple Pill Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16">
        <button
          onClick={onCreateRoomClick}
          className="w-full sm:w-auto apple-btn-primary px-7 py-3 text-sm font-medium cursor-pointer"
        >
          Start a Watch Party
        </button>

        <button
          onClick={onJoinRoomClick}
          className="w-full sm:w-auto apple-btn-secondary px-7 py-3 text-sm font-medium cursor-pointer"
        >
          Join with Code
        </button>
      </div>

      {/* Hardware / Window Preview Showcase */}
      <WatchRoomPreview />
    </section>
  );
};
