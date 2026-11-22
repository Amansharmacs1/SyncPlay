import React, { useState } from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { socketService } from '../../services/socket.js';
import { extractYouTubeId, isDirectVideoUrl } from '../../utils/urlHelper.js';
import { useToastStore } from '../../stores/useToastStore.js';
import {
  ListVideo,
  Play,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Video,
  FileVideo,
  X,
  Check,
} from 'lucide-react';

export const WatchQueuePanel: React.FC = () => {
  const { queue, isHost, participantId, allowParticipantControl } = useRoomStore();
  const { addToast } = useToastStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canControl = isHost || allowParticipantControl;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please provide a video URL.');
      return;
    }

    const ytId = extractYouTubeId(cleanUrl);
    const isDirect = isDirectVideoUrl(cleanUrl);

    if (!ytId && !isDirect) {
      setError('Invalid media URL. Please provide a YouTube link or a direct .mp4/.webm URL.');
      return;
    }

    const mediaType = ytId ? 'youtube' : 'direct';
    const finalTitle = title.trim() || (ytId ? `YouTube Video (${ytId})` : 'Direct Video Stream');

    socketService.addToQueue({
      type: mediaType,
      url: cleanUrl,
      title: finalTitle,
    });

    addToast(`Added to queue: ${finalTitle}`, 'success');
    setUrl('');
    setTitle('');
    setError(null);
    setIsAddOpen(false);
  };

  const handlePlayItem = (itemId: string) => {
    if (!canControl) return;
    socketService.playQueueItem(itemId);
  };

  const handleRemoveItem = (itemId: string) => {
    socketService.removeFromQueue(itemId);
    addToast('Removed from queue', 'info');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!isHost) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;

    const newQueue = [...queue];
    const [moved] = newQueue.splice(index, 1);
    newQueue.splice(targetIndex, 0, moved);

    socketService.reorderQueue(newQueue.map((q) => q.id));
  };

  return (
    <div className="flex flex-col h-full bg-background-card border border-surface-border rounded-2xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border bg-background-secondary/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListVideo className="w-4 h-4 text-accent-secondary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Watch Queue</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-accent-secondary bg-accent-primary/10 px-2 py-0.5 rounded-full border border-accent-primary/20">
            {queue.length} upcoming
          </span>
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="p-1.5 rounded-lg bg-accent-primary hover:bg-accent-secondary text-white text-xs font-semibold flex items-center gap-1 transition-all"
            title="Add Video to Queue"
          >
            {isAddOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Add to Queue Inline Form */}
      {isAddOpen && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3 border-b border-surface-border bg-background-secondary/90 space-y-2 animate-in fade-in slide-in-from-top-1"
        >
          {error && (
            <div className="p-2 text-[11px] text-status-error bg-status-error/10 border border-status-error/20 rounded-lg">
              {error}
            </div>
          )}
          <input
            type="url"
            required
            placeholder="YouTube link or .mp4 / .webm URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            className="w-full bg-background-primary border border-surface-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-text-dim focus:outline-none focus:border-accent-primary"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Video title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-background-primary border border-surface-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-text-dim focus:outline-none focus:border-accent-primary"
            />
            <button
              type="submit"
              className="accent-gradient-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-glow flex items-center gap-1 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Queue</span>
            </button>
          </div>
        </form>
      )}

      {/* Queue List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-dim">
            <ListVideo className="w-8 h-8 mb-2 opacity-40 text-accent-secondary" />
            <p className="text-xs font-semibold text-white">Queue is Empty</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Add upcoming videos so they autoplay when the current video finishes!
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-3 px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-background-hover border border-surface-border text-xs text-white flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-accent-secondary" />
              <span>Add Next Video</span>
            </button>
          </div>
        ) : (
          queue.map((item, index) => {
            const canDelete = isHost || item.addedById === participantId;
            const Icon = item.type === 'youtube' ? Video : FileVideo;

            return (
              <div
                key={item.id}
                className="group relative p-2.5 rounded-xl bg-background-secondary/60 border border-surface-border hover:border-surface-border/80 transition-all flex items-center justify-between gap-2.5"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-2.5 truncate flex-1">
                  <div className="w-7 h-7 rounded-lg bg-background-card border border-surface-border flex items-center justify-center flex-shrink-0 text-accent-secondary">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-text-dim truncate">
                      Added by <span className="text-accent-secondary">{item.addedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Reorder Buttons (Host only) */}
                  {isHost && queue.length > 1 && (
                    <div className="flex items-center">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        title="Move Up"
                        className="p-1 rounded text-text-dim hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={index === queue.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        title="Move Down"
                        className="p-1 rounded text-text-dim hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Play Now Button */}
                  {canControl && (
                    <button
                      onClick={() => handlePlayItem(item.id)}
                      title="Play Now"
                      className="p-1.5 rounded-lg bg-accent-primary/20 hover:bg-accent-primary text-accent-secondary hover:text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove from Queue"
                      className="p-1.5 rounded-lg text-text-dim hover:text-status-error hover:bg-status-error/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
