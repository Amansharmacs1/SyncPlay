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
        <span className="text-[11px] text-[#86868B] px-3 py-1 rounded-full bg-[#F5F5F7]">
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
      className={`relative flex items-start gap-2 group ${
        isSelf ? 'flex-row-reverse' : 'flex-row'
      } animate-in fade-in slide-in-from-bottom-1`}
    >
      <Avatar name={message.senderName} size="sm" className="mt-0.5 flex-shrink-0" />

      <div className={`max-w-[80%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
            isSelf
              ? 'bg-[#0071E3] text-white rounded-br-sm shadow-sm'
              : 'bg-[#E9E9EB] text-[#1D1D1F] rounded-bl-sm'
          }`}
        >
          {/* Header row: Sender name, Host badge, Time */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className={`font-medium text-[11px] ${
                isSelf ? 'text-white/90' : 'text-[#86868B]'
              }`}
            >
              {isSelf ? 'You' : message.senderName}
            </span>

            {isMessageHost && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold ${
                  isSelf
                    ? 'bg-white/20 text-white'
                    : 'bg-[#0071E3]/10 text-[#0071E3]'
                }`}
              >
                Host
              </span>
            )}

            <span className={`text-[10px] ${isSelf ? 'text-white/70' : 'text-[#86868B]'}`}>
              {timeString}
            </span>
          </div>

          {/* Message content */}
          <p className="break-words select-text text-[13px]">{message.message}</p>

          {/* Quick Reaction Button (hover trigger) */}
          <div
            className={`absolute top-1 ${
              isSelf ? '-left-7' : '-right-7'
            } opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="p-1 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#D2D2D7]/60 text-[#86868B] hover:text-[#1D1D1F] shadow-sm transition-colors cursor-pointer"
              title="React to message"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {/* Emoji reaction picker popup */}
            {showPicker && (
              <div
                className={`absolute bottom-full mb-1 ${
                  isSelf ? 'right-0' : 'left-0'
                } z-20 flex items-center gap-1 p-1 bg-white border border-[#D2D2D7]/60 rounded-full shadow-apple-modal`}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleToggleReaction(emoji)}
                    className="p-1.5 text-xs hover:bg-[#F5F5F7] rounded-full hover:scale-125 transition-transform cursor-pointer"
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
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    hasReacted
                      ? 'bg-[#E8F2FE] text-[#0071E3] border border-[#0071E3]/20 shadow-xs'
                      : 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7]/40 hover:bg-[#E8E8ED]'
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
