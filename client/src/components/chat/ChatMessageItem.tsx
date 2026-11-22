import React, { useState } from 'react';
import { ChatMessage } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { socketService } from '../../services/socket.js';
import { Smile } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
}

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👍'];

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const { participantId, room } = useRoomStore();
  const [showPicker, setShowPicker] = useState(false);

  const isSelf = message.senderId === participantId;
  const isMessageHost = room?.hostId === message.senderId;

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.isSystem) {
    return (
      <div className="flex items-center justify-center my-2 text-center animate-in fade-in">
        <span className="text-[11px] text-text-dim px-3 py-1 rounded-full bg-background-elevated/40 border border-surface-border/50">
          {message.message}
        </span>
      </div>
    );
  }

  const handleToggleReaction = (emoji: string) => {
    socketService.sendChatReaction(message.id, emoji);
    setShowPicker(false);
  };

  const reactionEntries = Object.entries(message.reactions || {}).filter(
    ([, users]) => Array.isArray(users) && users.length > 0
  );

  return (
    <div
      className={`relative flex items-start gap-2.5 group ${
        isSelf ? 'flex-row-reverse' : 'flex-row'
      } animate-in fade-in slide-in-from-bottom-1`}
    >
      <Avatar name={message.senderName} size="sm" className="mt-0.5 flex-shrink-0" />

      <div className={`max-w-[80%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
            isSelf
              ? 'bg-accent-primary text-white rounded-tr-none'
              : 'bg-background-elevated text-text-main border border-surface-border rounded-tl-none'
          }`}
        >
          {/* Header row: Sender name, Host badge, Time */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className={`font-semibold text-[11px] ${
                isSelf ? 'text-white/95' : 'text-accent-secondary'
              }`}
            >
              {isSelf ? 'You' : message.senderName}
            </span>

            {isMessageHost && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30">
                Host
              </span>
            )}

            <span className={`text-[10px] ${isSelf ? 'text-white/60' : 'text-text-dim'}`}>
              {timeString}
            </span>
          </div>

          {/* Message content */}
          <p className="break-words select-text">{message.message}</p>

          {/* Quick Reaction Button (hover trigger) */}
          <div
            className={`absolute top-1 ${
              isSelf ? '-left-7' : '-right-7'
            } opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="p-1 rounded-full bg-background-card hover:bg-background-hover border border-surface-border text-text-muted hover:text-white transition-colors"
              title="React to message"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {/* Emoji reaction picker popup */}
            {showPicker && (
              <div
                className={`absolute bottom-full mb-1 ${
                  isSelf ? 'right-0' : 'left-0'
                } z-20 flex items-center gap-1 p-1 bg-background-elevated border border-surface-border rounded-xl shadow-lg backdrop-blur-md`}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleToggleReaction(emoji)}
                    className="p-1.5 text-xs hover:bg-background-card rounded-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reaction Badges Row */}
        {reactionEntries.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {reactionEntries.map(([emoji, users]) => {
              const hasReacted = users.includes(participantId);
              return (
                <button
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    hasReacted
                      ? 'bg-accent-primary/20 border-accent-primary/50 text-accent-secondary'
                      : 'bg-background-elevated/80 border-surface-border text-text-muted hover:text-white'
                  }`}
                  title={`${users.length} reaction${users.length === 1 ? '' : 's'}`}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
