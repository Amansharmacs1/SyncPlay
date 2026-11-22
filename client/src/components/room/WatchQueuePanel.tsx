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

  const canControl = true; // Queue playback is available for everyone in the room

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    const ytId = extractYouTubeId(cleanUrl);
    const isDirect = isDirectVideoUrl(cleanUrl);

    if (!ytId && !isDirect) {
      setError('Please provide a valid YouTube video URL or direct .mp4/.webm URL.');
      return;
    }

    const type = ytId ? 'youtube' : 'direct';
    const computedTitle = title.trim() || (ytId ? `YouTube Video (${ytId})` : 'Direct Video Stream');

    socketService.addToQueue({
      type,
      url: cleanUrl,
      title: computedTitle,
    });

    addToast(`Added "${computedTitle}" to queue!`, 'success');
    setUrl('');
    setTitle('');
    setIsAddOpen(false);
    setError(null);
  };

  const handleRemoveItem = (itemId: string) => {
    socketService.removeFromQueue(itemId);
    addToast('Removed video from queue', 'info');
  };

  const handlePlayItem = (itemId: string) => {
    socketService.playQueueItem(itemId);
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
    <div className="flex flex-col h-full apple-card overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#D2D2D7]/50 bg-[#F5F5F7]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListVideo className="w-4 h-4 text-[#0071E3]" />
          <h2 className="text-xs font-semibold tracking-tight text-[#1D1D1F]">Up Next</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[#0071E3] bg-[#E8F2FE] px-2.5 py-0.5 rounded-full">
            {queue.length} upcoming
          </span>
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="w-7 h-7 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
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
          className="p-3 border-b border-[#D2D2D7]/50 bg-[#F5F5F7]/60 space-y-2 animate-in fade-in slide-in-from-top-1"
        >
          {error && (
            <div className="p-2 text-[11px] text-[#FF3B30] bg-[#FFF2F0] border border-[#FF3B30]/20 rounded-lg">
              {error}
            </div>
          )}
          <input
            type="url"
            required
            placeholder="YouTube or .mp4 URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            className="w-full bg-white border border-[#D2D2D7] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3]"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Video title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-white border border-[#D2D2D7] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3]"
            />
            <button
              type="submit"
              className="apple-btn-primary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Queue</span>
            </button>
          </div>
        </form>
      )}

      {/* Queue List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#86868B]">
            <ListVideo className="w-8 h-8 mb-2 opacity-30 text-[#0071E3]" />
            <p className="text-xs font-medium text-[#1D1D1F]">Queue is Empty</p>
            <p className="text-[11px] text-[#86868B] mt-0.5">
              Add upcoming videos so they autoplay when this video finishes
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-3 apple-btn-secondary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Add Video</span>
            </button>
          </div>
        ) : (
          queue.map((item, index) => {
            const canDelete = isHost || item.addedById === participantId;
            const Icon = item.type === 'youtube' ? Video : FileVideo;

            return (
              <div
                key={item.id}
                className="group relative p-2.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E8E8ED] transition-all flex items-center justify-between gap-2.5"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-2.5 truncate flex-1">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D2D2D7]/50 flex items-center justify-center flex-shrink-0 text-[#0071E3]">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-[#1D1D1F] truncate">{item.title}</div>
                    <div className="text-[10px] text-[#86868B] truncate">
                      Added by <span className="text-[#0071E3] font-medium">{item.addedBy}</span>
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
                        className="p-1 rounded text-[#86868B] hover:text-[#1D1D1F] disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={index === queue.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        title="Move Down"
                        className="p-1 rounded text-[#86868B] hover:text-[#1D1D1F] disabled:opacity-20 cursor-pointer"
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
                      className="p-1.5 rounded-full bg-white hover:bg-[#0071E3] text-[#0071E3] hover:text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove from Queue"
                      className="p-1.5 rounded-full text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
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
