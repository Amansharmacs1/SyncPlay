import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { socketService } from '../../services/socket.js';
import { Avatar } from '../common/Avatar.js';
import { Users, Crown, UserMinus, Video, MicOff, Monitor, PhoneCall } from 'lucide-react';

export const ParticipantList: React.FC = () => {
  const { room, isHost, participantId } = useRoomStore();

  if (!room) return null;

  const handleKick = (targetId: string, name: string) => {
    if (!isHost) return;
    if (confirm(`Remove ${name} from the room?`)) {
      socketService.kickParticipant(targetId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-card border border-surface-border rounded-2xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border bg-background-secondary/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-secondary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Participants</h2>
        </div>
        <span className="text-[11px] font-semibold text-accent-secondary bg-accent-primary/10 px-2 py-0.5 rounded-full border border-accent-primary/20">
          {room.participants.length} online
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {room.participants.map((p) => {
          const isMe = p.id === participantId;
          const joinTime = new Date(p.joinedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-background-secondary/50 border border-surface-border/60 hover:border-surface-border transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Avatar name={p.name} size="sm" isHost={p.isHost} />
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-text-dim font-normal">(you)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-status-success" />
                    <span>Joined {joinTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Media Badges */}
                {p.callConnected && (
                  <div className="flex items-center gap-1 bg-background-elevated px-1.5 py-0.5 rounded-md border border-surface-border">
                    {p.cameraEnabled ? (
                      <span title="Camera On">
                        <Video className="w-3 h-3 text-status-success" />
                      </span>
                    ) : null}
                    {p.microphoneEnabled === false ? (
                      <span title="Muted">
                        <MicOff className="w-3 h-3 text-status-error" />
                      </span>
                    ) : null}
                    {p.screenSharing ? (
                      <span title="Screen Sharing">
                        <Monitor className="w-3 h-3 text-accent-secondary" />
                      </span>
                    ) : null}
                    {!p.cameraEnabled && p.microphoneEnabled !== false && !p.screenSharing ? (
                      <span title="In Call">
                        <PhoneCall className="w-3 h-3 text-accent-secondary" />
                      </span>
                    ) : null}
                  </div>
                )}

                {p.isHost && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent-primary/20 text-accent-secondary border border-accent-primary/30">
                    <Crown className="w-3 h-3 text-accent-secondary" />
                    <span>Host</span>
                  </span>
                )}

                {/* Host kick option */}
                {isHost && !p.isHost && !isMe && (
                  <button
                    onClick={() => handleKick(p.id, p.name)}
                    title={`Remove ${p.name}`}
                    className="p-1 rounded-lg text-text-dim hover:text-status-error hover:bg-status-error/10 transition-colors"
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
