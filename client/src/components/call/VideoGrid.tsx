import React, { useEffect } from 'react';
import { useCallStore } from '../../stores/useCallStore.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { ParticipantTile } from './ParticipantTile.js';
import { ParticipantCallState } from '../../services/webrtc/types.js';
import { LayoutGrid, User, Sparkles, Video, Eye } from 'lucide-react';

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
    setPreJoinModalOpen,
  } = useCallStore();

  const { participantId, displayName, room } = useRoomStore();

  // Escape key returns to full Grid view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusedParticipantId) {
        setFocusedParticipantId(null);
        setCallLayout('grid');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedParticipantId, setFocusedParticipantId, setCallLayout]);

  // Build local participant call state
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
    inCall: isInCall,
  };

  // Harmonize all room participants (both in-call and present in room)
  const roomParticipantsList = room?.participants || [];
  let allParticipants: ParticipantCallState[] = [];

  if (roomParticipantsList.length > 0) {
    allParticipants = roomParticipantsList.map((rp) => {
      if (rp.id === participantId) {
        return localParticipant;
      }
      const remoteCallState = callParticipants.get(rp.id);
      if (remoteCallState) {
        return {
          ...remoteCallState,
          name: remoteCallState.name || rp.name || 'Friend',
          inCall: true,
        };
      }
      return {
        participantId: rp.id,
        name: rp.name || 'Friend',
        stream: null,
        cameraEnabled: false,
        microphoneEnabled: false,
        screenSharing: false,
        connectionQuality: 'good',
        audioLevel: 0,
        isLocal: false,
        inCall: false,
      };
    });

    // Ensure local participant is present
    if (!allParticipants.some((p) => p.participantId === participantId)) {
      allParticipants.unshift(localParticipant);
    }
  } else {
    allParticipants = [localParticipant, ...Array.from(callParticipants.values())];
  }

  // Active focused participant for Solo View
  const focusedParticipant = allParticipants.find(
    (p) => p.participantId === focusedParticipantId
  );

  const isSoloView = Boolean(focusedParticipantId && focusedParticipant);

  // Responsive grid columns based on count
  const getGridClasses = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-2';
    return 'grid-cols-2 sm:grid-cols-3';
  };

  const handleSelectSolo = (pId: string) => {
    setFocusedParticipantId(pId);
    setCallLayout('focus');
  };

  const handleShowAll = () => {
    setFocusedParticipantId(null);
    setCallLayout('grid');
  };

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {/* FaceTime Call Join Prompt Banner (when 2+ people in room but user is not in call yet) */}
      {!isInCall && allParticipants.length >= 2 && (
        <div className="apple-card p-3 sm:p-4 bg-gradient-to-r from-[#E8F2FE]/70 to-[#F5F5F7] border border-[#0071E3]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0071E3] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1D1D1F]">
                {allParticipants.length} people are in this room
              </div>
              <div className="text-[11px] text-[#86868B]">
                Start FaceTime to watch and talk together with live video and audio
              </div>
            </div>
          </div>

          <button
            onClick={() => setPreJoinModalOpen(true)}
            className="apple-btn-primary px-4 py-2 text-xs font-medium flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Video Call</span>
          </button>
        </div>
      )}

      {/* Apple Selector & Control Bar: "Select which one only we want to see" */}
      <div className="apple-card p-2.5 sm:p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>View:</span>
          </span>

          {/* Quick Participant Selector Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Show All (Grid) Option */}
            <button
              onClick={handleShowAll}
              title="Show All Participants in Grid"
              className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                !isSoloView
                  ? 'bg-[#0071E3] text-white shadow-xs font-medium'
                  : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>All ({allParticipants.length})</span>
            </button>

            {/* Individual Participant Selection Pills ("select which one only we want to see") */}
            {allParticipants.map((p) => {
              const isSelected = isSoloView && focusedParticipantId === p.participantId;
              return (
                <button
                  key={p.participantId}
                  onClick={() => handleSelectSolo(p.participantId)}
                  title={`Only see ${p.name}`}
                  className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#0071E3] text-white shadow-xs font-medium ring-2 ring-[#0071E3]/20'
                      : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]'
                  }`}
                >
                  <User className="w-3 h-3 opacity-70" />
                  <span className="max-w-[100px] truncate">
                    {p.name} {p.isLocal ? '(You)' : ''}
                  </span>
                  {p.inCall && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" title="In live call" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Solo View Indicator & Reset Pill */}
        {isSoloView && (
          <button
            onClick={handleShowAll}
            className="self-end sm:self-auto text-xs text-[#0071E3] hover:text-[#0077ED] font-medium flex items-center gap-1 cursor-pointer bg-[#E8F2FE] px-3 py-1 rounded-full transition-colors"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Back to Grid View</span>
          </button>
        )}
      </div>

      {/* Main Display: Solo View vs Grid View */}
      {isSoloView && focusedParticipant ? (
        /* SOLO VIEW: Shows ONLY the selected participant in full theater size */
        <div className="flex flex-col gap-3">
          {/* Main Large Solo Tile */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-[#D2D2D7]/50">
            <ParticipantTile
              participant={focusedParticipant}
              isFocused={true}
              onToggleFocus={handleShowAll}
              className="w-full h-full"
            />
          </div>

          {/* Quick Switch Thumbnail Carousel */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#86868B] px-1">
              Switch to see another person:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {allParticipants.map((p) => {
                const isCurrent = p.participantId === focusedParticipantId;
                return (
                  <button
                    key={p.participantId}
                    onClick={() => handleSelectSolo(p.participantId)}
                    className={`w-36 aspect-video rounded-xl overflow-hidden border transition-all flex-shrink-0 relative group text-left cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-[#0071E3] border-[#0071E3]'
                        : 'border-[#E5E5E7] hover:border-[#0071E3]/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <ParticipantTile
                      participant={p}
                      isFocused={false}
                      className="w-full h-full pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </button>
                );
              })}

              {/* Show All Card */}
              <button
                onClick={handleShowAll}
                className="w-28 aspect-video rounded-xl border border-dashed border-[#D2D2D7] bg-[#F5F5F7] hover:bg-[#E8E8ED] flex flex-col items-center justify-center gap-1 text-[#86868B] hover:text-[#1D1D1F] transition-all flex-shrink-0 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 text-[#0071E3]" />
                <span className="text-[11px] font-medium">Show All</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW: Shows ALL participants in balanced responsive grid */
        <div className={`grid gap-3 ${getGridClasses(allParticipants.length)}`}>
          {allParticipants.map((p) => (
            <div
              key={p.participantId}
              onClick={() => handleSelectSolo(p.participantId)}
              className="aspect-video w-full rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.01] cursor-pointer"
              title={`Click to only see ${p.name}`}
            >
              <ParticipantTile
                participant={p}
                isFocused={false}
                onToggleFocus={() => handleSelectSolo(p.participantId)}
                className="w-full h-full shadow-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
