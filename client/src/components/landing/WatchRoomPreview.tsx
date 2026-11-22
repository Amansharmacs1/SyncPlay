import React from 'react';
import { Play, MessageSquare, Users, Sparkles, Volume2 } from 'lucide-react';
import { Avatar } from '../common/Avatar.js';

export const WatchRoomPreview: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      {/* Background ambient glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-accent-primary/15 to-indigo-200/40 blur-2xl opacity-70" />

      {/* Mock Watch Room Interface Card */}
      <div className="relative rounded-2xl border border-surface-border bg-white shadow-card overflow-hidden">
        {/* Mock Window Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-slate-50/90">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            <span className="ml-3 text-xs text-text-muted font-mono">room / SP-7A9X</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="flex h-2 w-2 rounded-full bg-status-success animate-pulse" />
            <span className="text-status-success font-medium">3 synchronized</span>
          </div>
        </div>

        {/* Mock Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[340px]">
          {/* Mock Video Area (2 cols) */}
          <div className="lg:col-span-2 relative bg-slate-900 flex flex-col justify-between p-4 group">
            {/* Mock Video Background Image / Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center shadow-glow">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>

            {/* Floating participant badge */}
            <div className="relative z-10 flex items-center gap-2">
              <div className="bg-white/90 border border-white/20 px-3 py-1 rounded-full text-xs text-slate-800 backdrop-blur-md flex items-center gap-2 shadow-sm font-medium">
                <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                <span>Synchronized: 04:22 / 12:45</span>
              </div>
            </div>

            {/* Mock Player Bar */}
            <div className="relative z-10 mt-auto bg-slate-800/95 border border-slate-700/80 rounded-xl p-3 backdrop-blur-md flex flex-col gap-2 shadow-lg">
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-accent-primary to-accent-secondary h-full w-[38%]" />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-white fill-white cursor-pointer" />
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <span className="text-white font-mono">04:22</span>
                </div>
                <span className="text-xs text-accent-light font-medium">Host Controlling</span>
              </div>
            </div>
          </div>

          {/* Mock Chat & Presence Panel (1 col) */}
          <div className="hidden lg:flex flex-col border-l border-surface-border bg-slate-50/60 p-4 justify-between">
            {/* Participants avatars */}
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> In Room (3)
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Avatar name="Alex R" size="sm" isHost />
                <Avatar name="Elena K" size="sm" />
                <Avatar name="David M" size="sm" />
              </div>

              {/* Chat messages */}
              <div className="flex items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Live Chat
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-surface-border shadow-sm">
                  <span className="font-semibold text-accent-secondary">Alex:</span>{' '}
                  <span className="text-text-main">Wait for this transition! 🔥</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-surface-border shadow-sm">
                  <span className="font-semibold text-emerald-600">Elena:</span>{' '}
                  <span className="text-text-main">So smooth! Perfectly synced.</span>
                </div>
              </div>
            </div>

            {/* Input mock */}
            <div className="mt-4 pt-3 border-t border-surface-border">
              <div className="bg-white border border-surface-border rounded-xl px-3 py-2 text-xs text-text-dim shadow-xs">
                Type a message...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
