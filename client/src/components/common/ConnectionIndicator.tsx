import React from 'react';
import { ConnectionStatus } from '../../types/index.js';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  showText?: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  showText = true,
}) => {
  const config = {
    connected: {
      color: 'bg-status-success',
      text: 'Live Sync',
      textColor: 'text-status-success',
      pulse: true,
    },
    connecting: {
      color: 'bg-status-warning',
      text: 'Connecting...',
      textColor: 'text-status-warning',
      pulse: true,
    },
    reconnecting: {
      color: 'bg-status-warning',
      text: 'Reconnecting...',
      textColor: 'text-status-warning',
      pulse: true,
    },
    disconnected: {
      color: 'bg-status-error',
      text: 'Offline',
      textColor: 'text-status-error',
      pulse: false,
    },
    error: {
      color: 'bg-status-error',
      text: 'Sync Error',
      textColor: 'text-status-error',
      pulse: false,
    },
  }[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
      </span>
      {showText && (
        <span className={`text-xs font-medium uppercase tracking-wider ${config.textColor}`}>
          {config.text}
        </span>
      )}
    </div>
  );
};
