import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';
import { HeroSection } from '../components/landing/HeroSection.js';
import { FeaturesSection } from '../components/landing/FeaturesSection.js';
import { HowItWorksSection } from '../components/landing/HowItWorksSection.js';
import { CreateRoomModal } from '../components/landing/CreateRoomModal.js';
import { JoinRoomModal } from '../components/landing/JoinRoomModal.js';

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
        <HowItWorksSection />
        <FeaturesSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
};
