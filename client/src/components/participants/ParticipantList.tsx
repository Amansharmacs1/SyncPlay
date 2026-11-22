import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { socketService } from '../../services/socket.js';
import { Avatar } from '../common/Avatar.js';
import { Users, Crown, UserMinus, Video, MicOff, Monitor, PhoneCall } from 'lucide-react';

export const ParticipantList: React.FC = () => {
  const { room, isHost, participantId, participants: storeParticipants } = useRoomStore();

  const participantsList = storeParticipants && storeParticipants.length > 0
    ? storeParticipants
    : (room?.participants || []);

  if (!room && participantsList.length === 0) return null;

  const handleKick = (targetId: string, name: string) => {
    if (!isHost) return;
    if (confirm(`Remove ${name} from the room?`)) {
      socketService.kickParticipant(targetId);
    }
  };

  return (
    <div className="flex flex-col h-full apple-card overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#D2D2D7]/50 bg-[#F5F5F7]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0071E3]" />
          <h2 className="text-xs font-semibold tracking-tight text-[#1D1D1F]">People</h2>
        </div>
        <span className="text-[11px] font-medium text-[#0071E3] bg-[#E8F2FE] px-2.5 py-0.5 rounded-full">
          {participantsList.length} present
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
        {participantsList.map((p) => {
          const isMe = p.id === participantId;
          const joinTime = new Date(p.joinedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E8E8ED] transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Avatar name={p.name} size="sm" isHost={p.isHost} />
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#1D1D1F] truncate">
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-[#86868B] font-normal">(you)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#86868B]">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#34C759]" />
                    <span>Joined {joinTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Media Badges */}
                {p.callConnected && (
                  <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full border border-[#D2D2D7]/50 shadow-xs">
                    {p.cameraEnabled ? (
                      <span title="Camera On">
                        <Video className="w-3 h-3 text-[#34C759]" />
                      </span>
                    ) : null}
                    {p.microphoneEnabled === false ? (
                      <span title="Muted">
                        <MicOff className="w-3 h-3 text-[#FF3B30]" />
                      </span>
                    ) : null}
                    {p.screenSharing ? (
                      <span title="Screen Sharing">
                        <Monitor className="w-3 h-3 text-[#0071E3]" />
                      </span>
                    ) : null}
                    {!p.cameraEnabled && p.microphoneEnabled !== false && !p.screenSharing ? (
                      <span title="In Call">
                        <PhoneCall className="w-3 h-3 text-[#0071E3]" />
                      </span>
                    ) : null}
                  </div>
                )}

                {p.isHost && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E8F2FE] text-[#0071E3]">
                    <Crown className="w-3 h-3 text-[#0071E3]" />
                    <span>Host</span>
                  </span>
                )}

                {/* Host kick option */}
                {isHost && !p.isHost && !isMe && (
                  <button
                    onClick={() => handleKick(p.id, p.name)}
                    title={`Remove ${p.name}`}
                    className="p-1.5 rounded-full text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
