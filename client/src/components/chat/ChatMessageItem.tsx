import React from 'react';
import { ChatMessage } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import { useRoomStore } from '../../stores/useRoomStore.js';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const { participantId } = useRoomStore();
  const isSelf = message.senderId === participantId;

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.isSystem) {
    return (
      <div className="flex items-center justify-center my-2 text-center">
        <span className="text-[11px] text-text-dim px-3 py-1 rounded-full bg-background-elevated/40 border border-surface-border/50">
          {message.message}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-2.5 group ${
        isSelf ? 'flex-row-reverse' : 'flex-row'
      } animate-in fade-in slide-in-from-bottom-1`}
    >
      <Avatar name={message.senderName} size="sm" className="mt-0.5" />

      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
          isSelf
            ? 'bg-accent-primary text-white rounded-tr-none'
            : 'bg-background-elevated text-text-main border border-surface-border rounded-tl-none'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`font-semibold text-[11px] ${
              isSelf ? 'text-white/90' : 'text-accent-secondary'
            }`}
          >
            {isSelf ? 'You' : message.senderName}
          </span>
          <span
            className={`text-[10px] ${
              isSelf ? 'text-white/60' : 'text-text-dim'
            }`}
          >
            {timeString}
          </span>
        </div>
        <p className="break-words select-text">{message.message}</p>
      </div>
    </div>
  );
};
