import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed previously this session
    if (sessionStorage.getItem('syncplay_pwa_dismissed') === 'true') {
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted SyncPlay PWA install prompt');
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('syncplay_pwa_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Install App" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-3 fade-in duration-300">
      <div className="bg-white/95 border border-[#D2D2D7]/60 rounded-3xl p-4 shadow-apple-float backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0071E3] flex items-center justify-center flex-shrink-0 text-white shadow-sm">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1D1D1F]">Install SyncPlay</h4>
            <p className="text-[11px] text-[#86868B]">
              Add to Home Screen for fullscreen watch parties
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="apple-btn-primary px-3.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            Get
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss app install banner"
            className="w-7 h-7 rounded-full bg-[#E8E8ED] hover:bg-[#D2D2D7] text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
