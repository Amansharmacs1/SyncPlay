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
      <div className="bg-background-card/95 border border-accent-primary/40 rounded-2xl p-4 shadow-modal backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center flex-shrink-0 shadow-glow">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install SyncPlay App</h4>
            <p className="text-[11px] text-text-muted">
              Add to home screen for fullscreen watch parties & fast launching.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="accent-gradient-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-glow"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss app install banner"
            className="p-1 text-text-dim hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
