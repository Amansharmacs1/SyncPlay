import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';
import { HeroSection } from '../components/landing/HeroSection.js';
import { RecentRoomsSection } from '../components/landing/RecentRoomsSection.js';
import { FeaturesSection } from '../components/landing/FeaturesSection.js';
import { HowItWorksSection } from '../components/landing/HowItWorksSection.js';
import { CreateRoomModal } from '../components/landing/CreateRoomModal.js';
import { JoinRoomModal } from '../components/landing/JoinRoomModal.js';
import { Play, Sparkles, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background-primary text-text-main selection:bg-accent-primary selection:text-white">
      {/* Navbar */}
      <Navbar
        onCreateRoomClick={() => setIsCreateOpen(true)}
        onJoinRoomClick={() => setIsJoinOpen(true)}
      />

      {/* Main Sections */}
      <main className="flex-1">
        <HeroSection
          onCreateRoomClick={() => setIsCreateOpen(true)}
          onJoinRoomClick={() => setIsJoinOpen(true)}
        />

        {/* Browser-Local History (No Accounts) */}
        <RecentRoomsSection />

        <HowItWorksSection />

        <FeaturesSection />

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="relative rounded-3xl bg-white border border-surface-border p-8 sm:p-14 overflow-hidden shadow-card">
            {/* Ambient Indigo Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent-primary/10 blur-[120px] pointer-events-none rounded-full" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-light border border-accent-primary/20 text-xs text-accent-secondary font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                <span>Ready in 5 seconds • No Account Required</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-text-main tracking-tight mb-4">
                Distance shouldn't stop movie night.
              </h2>

              <p className="text-sm sm:text-base text-text-muted mb-8 leading-relaxed font-normal">
                Invite your friends, paste a video link, and enjoy synchronized playback with live face-to-face video and voice chat.
              </p>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="accent-gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-base shadow-glow inline-flex items-center gap-2.5 hover:scale-105 transition-all group cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Watching Together</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
};
