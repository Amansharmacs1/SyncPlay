import React from 'react';
import { Film, MessageSquare, Lock, Laptop } from 'lucide-react';
import { FeatureCard } from './FeatureCard.js';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Film,
      title: 'Synchronized Watching',
      description:
        'Authoritative playback synchronization engine keeps everyone on the exact same frame, with intelligent drift correction and zero lag.',
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Chat',
      description:
        'React to every plot twist instantly with low-latency text chat, emoji support, participant mentions, and real-time activity indicators.',
    },
    {
      icon: Lock,
      title: 'Private Watch Rooms',
      description:
        'Secure rooms with password protection, role-based controls for hosts, and cryptographically secure shareable room links.',
    },
    {
      icon: Laptop,
      title: 'Cross-Device Compatibility',
      description:
        'Watch seamlessly without installing apps. Works on iPhone, Android, iPad, Mac, Windows, Linux, and all modern mobile and desktop browsers.',
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs uppercase tracking-widest text-accent-secondary font-semibold mb-3">
          Engineered for Pure Entertainment
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Everything you need for an unforgettable watch party.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
};
