import React from 'react';
import { useToastStore } from '../../stores/useToastStore.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'border-surface-border';
        let bgClass = 'bg-background-card';
        let textClass = 'text-accent-secondary';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-status-success/30';
          textClass = 'text-status-success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-status-error/30';
          textClass = 'text-status-error';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-card border ${borderClass} ${bgClass} backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textClass}`} />
            <div className="flex-1 text-sm text-text-main font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
