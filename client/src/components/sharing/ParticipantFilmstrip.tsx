import React from 'react';
import { useCallStore } from '../../stores/useCallStore.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { ParticipantTile } from '../call/ParticipantTile.js';
import { ParticipantCallState } from '../../services/webrtc/types.js';

interface ParticipantFilmstripProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const ParticipantFilmstrip: React.FC<ParticipantFilmstripProps> = ({
  orientation = 'horizontal',
  className = '',
}) => {
  const {
    isInCall,
    localStream,
    screenStream,
    cameraEnabled,
    microphoneEnabled,
    isScreenSharing,
    callParticipants,
    focusedParticipantId,
    setFocusedParticipantId,
  } = useCallStore();

  const { participantId, displayName, room, participants: storeParticipants } = useRoomStore();

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

  // Harmonize all room participants
  const rawList =
    storeParticipants && storeParticipants.length > 0
      ? storeParticipants
      : room?.participants || [];

  const participantMap = new Map<string, ParticipantCallState>();
  participantMap.set(participantId, localParticipant);

  rawList.forEach((rp) => {
    if (rp.id === participantId) {
      participantMap.set(participantId, {
        ...localParticipant,
        name: displayName || rp.name || 'You',
      });
      return;
    }

    const remoteCallState = callParticipants.get(rp.id);
    if (remoteCallState) {
      participantMap.set(rp.id, {
        ...remoteCallState,
        name: remoteCallState.name || rp.name || 'Friend',
        inCall: true,
      });
    } else {
      participantMap.set(rp.id, {
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
      });
    }
  });

  callParticipants.forEach((cp, cpId) => {
    if (!participantMap.has(cpId)) {
      participantMap.set(cpId, { ...cp, inCall: true });
    }
  });

  const allParticipants = Array.from(participantMap.values());

  const handleTileClick = (pId: string) => {
    if (focusedParticipantId === pId) {
      setFocusedParticipantId(null);
    } else {
      setFocusedParticipantId(pId);
    }
  };

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex ${
        isVertical
          ? 'flex-col gap-2.5 overflow-y-auto max-h-[580px] pr-1 scrollbar-thin'
          : 'flex-row items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin'
      } ${className}`}
    >
      {allParticipants.map((p) => {
        const isFocused = focusedParticipantId === p.participantId;
        return (
          <div
            key={p.participantId}
            onClick={() => handleTileClick(p.participantId)}
            className={`aspect-video rounded-xl overflow-hidden flex-shrink-0 cursor-pointer transition-all duration-200 relative group ${
              isVertical ? 'w-full' : 'w-44 sm:w-48'
            } ${
              isFocused
                ? 'ring-2 ring-[#0071E3] shadow-md scale-[1.02]'
                : 'hover:ring-2 hover:ring-[#0071E3]/50'
            }`}
          >
            <ParticipantTile
              participant={p}
              isFocused={isFocused}
              onToggleFocus={() => handleTileClick(p.participantId)}
              className="w-full h-full"
            />
          </div>
        );
      })}
    </div>
  );
};
