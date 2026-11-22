import React from 'react';
import { Film, Video, Mic, Tv, MessageSquare, Smartphone } from 'lucide-react';
import { FeatureCard } from './FeatureCard.js';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Film,
      title: 'Synchronized Watching',
      description:
        'Authoritative playback synchronization engine keeps everyone on the exact same frame across YouTube and direct MP4/WebM videos with intelligent drift correction.',
    },
    {
      icon: Video,
      title: 'HD Video Calling',
      description:
        'Real-time peer-to-peer WebRTC video calling. See your friends’ genuine expressions with adaptive quality and picture-in-picture mode.',
    },
    {
      icon: Mic,
      title: 'Live Voice Chat',
      description:
        'Crystal-clear audio with echo cancellation, automatic noise suppression, and active speaker detection so conversations flow naturally.',
    },
    {
      icon: Tv,
      title: 'Screen Sharing',
      description:
        'Share your browser tabs, presentations, documents, or games directly into the room with 60 FPS support for full-room collaboration.',
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Chat & Reactions',
      description:
        'Live low-latency chat with emoji reactions (❤️, 🔥, 😂, 👍), quick reaction badges, smart auto-scroll, and host indicators.',
    },
    {
      icon: Smartphone,
      title: 'Cross-Device Experience',
      description:
        'Installable Progressive Web App (PWA) with zero setup. Runs natively across iPhone, Android, iPad, Mac, Windows, and Linux browsers without accounts.',
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs uppercase tracking-widest text-accent-primary font-bold mb-3">
          Engineered for Pure Social Entertainment
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight">
          Everything you need for an unforgettable watch party.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
};
