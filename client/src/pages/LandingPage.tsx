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

        {/* Final CTA Section - Apple Minimalist Banner */}
        <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <div className="apple-card p-10 sm:p-16 bg-white">
            <div className="max-w-2xl mx-auto">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0071E3] block mb-3">
                Zero Friction
              </span>

              <h2 className="text-3xl sm:text-5xl font-semibold text-[#1D1D1F] tracking-tight mb-4">
                Distance shouldn't stop movie night.
              </h2>

              <p className="text-base text-[#86868B] mb-8 leading-relaxed font-normal">
                Invite your favorite people, paste a video link, and enjoy synchronized playback with live face-to-face video calling.
              </p>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="apple-btn-primary px-8 py-3.5 text-base font-medium inline-flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Watching Together</span>
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
