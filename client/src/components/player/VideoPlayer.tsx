import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { YouTubePlayer } from './YouTubePlayer.js';
import { DirectVideoPlayer } from './DirectVideoPlayer.js';
import { Film } from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const { room } = useRoomStore();

  if (!room || !room.media) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-white border border-surface-border flex flex-col items-center justify-center p-6 text-center shadow-card">
        <Film className="w-12 h-12 text-accent-primary mb-3 opacity-60" />
        <h3 className="text-base font-semibold text-text-main">No Video Selected</h3>
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
