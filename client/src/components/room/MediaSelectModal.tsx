import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { socketService } from '../../services/socket.js';
import { extractYouTubeId, isDirectVideoUrl } from '../../utils/urlHelper.js';
import { useToastStore } from '../../stores/useToastStore.js';
import { Video, FileVideo, Film, Sparkles, Check } from 'lucide-react';

interface MediaSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    type: 'youtube' as const,
    title: '4K Cinematic Nature (Creative Commons)',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    badge: 'YouTube 4K',
  },
  {
    type: 'youtube' as const,
    title: 'Lofi Hip Hop Radio — Beats to Relax/Study to',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    badge: 'YouTube Live/Music',
  },
  {
    type: 'direct' as const,
    title: 'Big Buck Bunny (Open Source 4K)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    badge: 'Direct MP4',
  },
  {
    type: 'direct' as const,
    title: 'Sintel Animated Film (Open Movie)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    badge: 'Direct MP4',
  },
];

export const MediaSelectModal: React.FC<MediaSelectModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToastStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please provide a video URL.');
      return;
    }

    // Determine type
    const ytId = extractYouTubeId(cleanUrl);
    const isDirect = isDirectVideoUrl(cleanUrl);

    if (!ytId && !isDirect) {
      setError('Invalid media URL. Please provide a YouTube link or a direct .mp4/.webm URL.');
      return;
    }

    const mediaType = ytId ? 'youtube' : 'direct';
    const finalTitle = title.trim() || (ytId ? `YouTube Video (${ytId})` : 'Direct Video Stream');

    socketService.changeMedia({
      type: mediaType,
      url: cleanUrl,
      title: finalTitle,
    });

    addToast(`Changed video to: ${finalTitle}`, 'success');
    setUrl('');
    setTitle('');
    setError(null);
    onClose();
  };

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setUrl(preset.url);
    setTitle(preset.title);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Video" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-status-error bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* URL Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
            <span>Video URL</span>
            <span className="text-[11px] text-accent-primary font-semibold normal-case">
              YouTube or .mp4 / .webm
            </span>
          </label>
          <input
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=... or .mp4 URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
          />
        </div>

        {/* Video Title (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Custom Title <span className="text-text-dim text-[11px] normal-case">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Saturday Night Film"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
          />
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
            <span>Quick Sample Videos</span>
          </label>
          <div className="space-y-2">
            {PRESETS.map((preset) => {
              const isSelected = url === preset.url;
              const Icon = preset.type === 'youtube' ? Video : FileVideo;
              return (
                <button
                  type="button"
                  key={preset.title}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent-primary bg-accent-light text-accent-secondary shadow-xs'
                      : 'border-surface-border bg-slate-50 text-text-muted hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 text-accent-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-text-main truncate">{preset.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white border border-surface-border text-text-muted font-semibold">
                      {preset.badge}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-accent-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full accent-gradient-btn py-3 px-4 rounded-xl text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-2 cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>Load Video for Everyone</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
