import React from 'react';
import { Play, Heart, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-surface-border bg-background-secondary/95 backdrop-blur-md pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-surface-border">
          {/* Col 1: Brand & Vision (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Sync<span className="text-accent-secondary">Play</span>
              </span>
            </div>

            <p className="text-sm font-semibold text-accent-secondary">
              Watch together. Talk together. Anywhere.
            </p>

            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              The modern social watch-party platform engineered for real-time video synchronization,
              crystal-clear WebRTC video calling, voice chat, and instant live messaging. Completely
              account-free with zero friction.
            </p>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-[11px] text-accent-secondary font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-primary" />
              <span>100% Account-Free • No Login Required</span>
            </div>
          </div>

          {/* Col 2: Quick Links (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-muted">
              <a href="#hero" className="hover:text-white transition-colors">
                Instant Room Setup
              </a>
              <a href="#features" className="hover:text-white transition-colors">
                Real-Time Features
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <span className="text-text-dim cursor-default">
                WebRTC Mesh Topology (P2P)
              </span>
              <span className="text-text-dim cursor-default">
                Progressive Web App (PWA)
              </span>
            </div>
          </div>

          {/* Col 3: Developer Portfolio & Attribution (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-3 p-5 rounded-2xl bg-background-card/90 border border-surface-border">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent-primary fill-accent-primary" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Built with passion by Aman Sharma
              </h4>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Crafting digital experiences that bring people closer.
            </p>

            <div className="pt-2">
              <a
                href="https://amansharma.space"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl accent-gradient-btn text-xs font-semibold text-white shadow-glow hover:opacity-95 transition-all group"
              >
                <span>Visit Developer Portfolio ↗</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Note */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-dim">
          <div>
            © {new Date().getFullYear()} SyncPlay. All rights reserved.
          </div>
          <div className="text-center sm:text-right">
            Made for moments that matter.
          </div>
        </div>
      </div>
    </footer>
  );
};
