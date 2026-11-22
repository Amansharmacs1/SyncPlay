import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  isHost?: boolean;
  className?: string;
}

const GRADIENTS = [
  'from-purple-600 to-indigo-600',
  'from-blue-600 to-teal-500',
  'from-pink-600 to-rose-500',
  'from-amber-600 to-orange-500',
  'from-emerald-600 to-green-500',
  'from-violet-600 to-purple-800',
];

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  isHost = false,
  className = '',
}) => {
  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GRADIENTS.length;
    return GRADIENTS[index];
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-bold',
  }[size];

  return (
    <div className={`relative inline-flex flex-shrink-0 items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses} rounded-full bg-gradient-to-br ${getGradient(
          name
        )} text-white font-medium flex items-center justify-center shadow-sm select-none border border-white/10`}
      >
        {getInitials(name)}
      </div>
      {isHost && (
        <span
          title="Room Host"
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-primary text-[9px] font-bold text-white shadow ring-2 ring-background-primary"
        >
          ★
        </span>
      )}
    </div>
  );
};
