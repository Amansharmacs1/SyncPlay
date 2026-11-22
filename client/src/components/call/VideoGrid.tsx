import React from 'react';
import { useCallStore } from '../../stores/useCallStore.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { ParticipantTile } from './ParticipantTile.js';
import { ParticipantCallState } from '../../services/webrtc/types.js';
import { LayoutGrid, Maximize, Columns } from 'lucide-react';

interface VideoGridProps {
  className?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ className = '' }) => {
  const {
    isInCall,
    localStream,
    screenStream,
    cameraEnabled,
    microphoneEnabled,
    isScreenSharing,
    callParticipants,
    callLayout,
    setCallLayout,
    focusedParticipantId,
    setFocusedParticipantId,
  } = useCallStore();

  const { participantId, displayName } = useRoomStore();

  if (!isInCall) return null;

  // Build local participant state
  const localParticipant: ParticipantCallState = {
    participantId,
    name: displayName || 'You',
    stream: isScreenSharing ? screenStream : localStream,
    cameraEnabled: isScreenSharing ? true : cameraEnabled,
    microphoneEnabled,
    screenSharing: isScreenSharing,
    connectionQuality: 'excellent',
    audioLevel: 0,
    isLocal: true,
  };

  // All participants in call
  const allParticipants: ParticipantCallState[] = [
    localParticipant,
    ...Array.from(callParticipants.values()),
  ];

  const focusedParticipant = allParticipants.find((p) => p.participantId === focusedParticipantId);

  // Dynamic grid classes based on participant count
  const getGridClasses = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-2 sm:grid-cols-3';
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Layout Control Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-surface-border rounded-xl text-xs text-text-muted shadow-sm">
        <span className="font-semibold text-text-main">
          In Call ({allParticipants.length})
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setCallLayout('sidebar');
              setFocusedParticipantId(null);
            }}
            title="Sidebar Strip"
            className={`p-1.5 rounded-lg transition-colors ${
              callLayout === 'sidebar'
                ? 'bg-accent-light text-accent-secondary border border-accent-primary/20'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setCallLayout('grid');
              setFocusedParticipantId(null);
            }}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-colors ${
              callLayout === 'grid'
                ? 'bg-accent-light text-accent-secondary border border-accent-primary/20'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Focus View */}
      {callLayout === 'focus' && focusedParticipant ? (
        <div className="flex flex-col gap-3">
          {/* Main Focused Tile */}
          <div className="w-full aspect-video">
            <ParticipantTile
              participant={focusedParticipant}
              isFocused={true}
              onToggleFocus={() => setFocusedParticipantId(null)}
              className="w-full h-full shadow-2xl"
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {allParticipants
              .filter((p) => p.participantId !== focusedParticipantId)
              .map((p) => (
                <div key={p.participantId} className="w-36 h-24 flex-shrink-0">
                  <ParticipantTile
                    participant={p}
                    onToggleFocus={() => setFocusedParticipantId(p.participantId)}
                    className="w-full h-full cursor-pointer hover:border-accent-primary transition-all"
                  />
                </div>
              ))}
          </div>
        </div>
      ) : callLayout === 'sidebar' ? (
        /* Sidebar Strip View */
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-[520px] pb-2 lg:pb-0">
          {allParticipants.map((p) => (
            <div key={p.participantId} className="w-48 lg:w-full aspect-video flex-shrink-0">
              <ParticipantTile
                participant={p}
                onToggleFocus={() => {
                  setFocusedParticipantId(p.participantId);
                  setCallLayout('focus');
                }}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      ) : (
        /* Grid View */
        <div className={`grid gap-3 ${getGridClasses(allParticipants.length)}`}>
          {allParticipants.map((p) => (
            <div key={p.participantId} className="aspect-video w-full">
              <ParticipantTile
                participant={p}
                onToggleFocus={() => {
                  setFocusedParticipantId(p.participantId);
                  setCallLayout('focus');
                }}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
