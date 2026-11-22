import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { YouTubePlayer } from './YouTubePlayer.js';
import { DirectVideoPlayer } from './DirectVideoPlayer.js';
import { Film } from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const { room } = useRoomStore();

  if (!room || !room.media) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-background-card border border-surface-border flex flex-col items-center justify-center p-6 text-center">
        <Film className="w-12 h-12 text-accent-secondary mb-3 opacity-50" />
        <h3 className="text-base font-semibold text-white">No Video Selected</h3>
        <p className="text-sm text-text-muted mt-1">
          Wait for the host to choose a video, or change video if you are the host.
        </p>
      </div>
    );
  }

  const { type, url } = room.media;

  if (type === 'youtube') {
    return <YouTubePlayer key={url} url={url} />;
  }

  return <DirectVideoPlayer key={url} url={url} />;
};
