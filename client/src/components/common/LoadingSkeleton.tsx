import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = 'h-6 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-background-elevated/60 rounded-lg ${className}`}
    />
  );
};
