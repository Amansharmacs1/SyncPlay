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
        <span className="text-[11px] text-text-muted px-3 py-1 rounded-full bg-slate-100 border border-surface-border">
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
              ? 'bg-accent-primary text-white rounded-tr-none shadow-xs'
              : 'bg-white text-text-main border border-surface-border rounded-tl-none shadow-sm'
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
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  isSelf
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-accent-light text-accent-secondary border border-accent-primary/30'
                }`}
              >
                Host
              </span>
            )}

            <span className={`text-[10px] ${isSelf ? 'text-white/70' : 'text-text-dim'}`}>
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
              className="p-1 rounded-full bg-white hover:bg-slate-100 border border-surface-border text-text-muted hover:text-text-main shadow-xs transition-colors cursor-pointer"
              title="React to message"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {/* Emoji reaction picker popup */}
            {showPicker && (
              <div
                className={`absolute bottom-full mb-1 ${
                  isSelf ? 'right-0' : 'left-0'
                } z-20 flex items-center gap-1 p-1 bg-white border border-surface-border rounded-xl shadow-modal`}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleToggleReaction(emoji)}
                    className="p-1.5 text-xs hover:bg-slate-100 rounded-lg hover:scale-125 transition-transform cursor-pointer"
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
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer ${
                    hasReacted
                      ? 'bg-accent-light border-accent-primary/40 text-accent-secondary shadow-xs'
                      : 'bg-white border-surface-border text-text-muted hover:bg-slate-100'
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
