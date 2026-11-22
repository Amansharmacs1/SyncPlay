import React from 'react';
import { ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#D2D2D7]/60 bg-[#F5F5F7] text-[#86868B] py-12 px-4 sm:px-6 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Developer Attribution Card - Apple Bento Style */}
        <div className="apple-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-white">
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2 text-[#1D1D1F] font-semibold text-sm sm:text-base">
              <span>Built with passion by Aman Sharma</span>
              <Heart className="w-4 h-4 text-[#FF2D55] fill-[#FF2D55]" />
            </div>
            <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
              Crafting digital experiences that bring people closer.
            </p>
          </div>

          <a
            href="https://amansharma.space"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-btn-primary px-5 py-2 text-xs font-medium inline-flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <span>Visit Developer Portfolio ↗</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Minimalist Apple-Style Bottom Metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868B] border-t border-[#D2D2D7]/40 pt-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1D1D1F]">SyncPlay</span>
            <span>•</span>
            <span>Watch together. Talk together. Anywhere.</span>
          </div>
          <div>
            © {new Date().getFullYear()} SyncPlay. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
