import React from 'react';
import { Play } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-surface-border bg-background-secondary py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-primary flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SyncPlay</span>
          </div>
          <p className="text-sm text-text-muted text-center md:text-left">
            Watch together. Talk together. Anywhere.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-muted">
          <a href="#hero" className="hover:text-white transition-colors">
            About
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a href="#privacy" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#terms" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>

        <div className="text-xs text-text-dim text-center md:text-right">
          © {new Date().getFullYear()} SyncPlay. All rights reserved. Built with precision.
        </div>
      </div>
    </footer>
  );
};
