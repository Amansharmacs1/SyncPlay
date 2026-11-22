import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-white border border-surface-border rounded-2xl shadow-modal overflow-hidden transform transition-all z-10`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-slate-50/70">
          <h3 className="text-base font-bold text-text-main">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
