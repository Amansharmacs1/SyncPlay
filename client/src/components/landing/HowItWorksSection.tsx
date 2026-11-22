import React from 'react';
import { Sparkles, UserPlus, PlayCircle } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: Sparkles,
      title: 'Create a room',
      desc: 'Set up your watch room in seconds with custom privacy settings, room title, and optional password.',
    },
    {
      num: '02',
      icon: UserPlus,
      title: 'Invite your friends',
      desc: 'Copy your unique room invite link or share your 6-digit room code with one click.',
    },
    {
      num: '03',
      icon: PlayCircle,
      title: 'Press play and enjoy',
      desc: 'Paste a YouTube video or direct MP4/WebM URL. The playback stays frame-synchronized for all viewers.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-background-secondary/40 border-y border-surface-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest text-accent-secondary font-semibold mb-3">
            Simple 3-Step Flow
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How SyncPlay Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative rounded-2xl bg-background-card border border-surface-border p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-secondary">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-surface-border font-mono">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
