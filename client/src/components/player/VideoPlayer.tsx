import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { YouTubePlayer } from './YouTubePlayer.js';
import { DirectVideoPlayer } from './DirectVideoPlayer.js';
import { Film } from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const { room } = useRoomStore();

  if (!room || !room.media) {
    return (
      <div className="w-full aspect-video rounded-2xl sm:rounded-3xl bg-white border border-[#D2D2D7]/60 flex flex-col items-center justify-center p-6 text-center shadow-apple-card">
        <Film className="w-12 h-12 text-[#0071E3] mb-3 opacity-40" />
        <h3 className="text-base font-semibold text-[#1D1D1F]">No Video Selected</h3>
        <p className="text-sm text-[#86868B] mt-1 max-w-sm">
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
