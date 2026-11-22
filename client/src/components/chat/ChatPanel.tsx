import React, { useState, useRef, useEffect } from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { socketService } from '../../services/socket.js';
import { ChatMessageItem } from './ChatMessageItem.js';
import { Send, MessageSquare } from 'lucide-react';

const QUICK_EMOJIS = ['🔥', '❤️', '😂', '👏', '🍿', '😮', '🎉'];

export const ChatPanel: React.FC = () => {
  const { messages } = useRoomStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    socketService.sendMessage(clean);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="flex flex-col h-full bg-background-card border border-surface-border rounded-2xl overflow-hidden shadow-card">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-surface-border bg-background-secondary/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-secondary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Live Chat</h2>
        </div>
        <span className="text-[11px] text-text-dim">{messages.length} messages</span>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-dim">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-accent-secondary" />
            <p className="text-xs">No messages yet.</p>
            <p className="text-[11px] text-text-muted mt-0.5">Say hello to everyone in the room!</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Bar */}
      <div className="px-3 py-1.5 border-t border-surface-border bg-background-secondary/40 flex items-center gap-1.5 overflow-x-auto">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => addEmoji(emoji)}
            className="text-sm p-1 rounded-md hover:bg-background-elevated transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-surface-border bg-background-secondary/80 flex items-center gap-2"
      >
        <input
          type="text"
          maxLength={1000}
          placeholder="Send a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-background-primary border border-surface-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="accent-gradient-btn p-2 rounded-xl text-white shadow-glow disabled:opacity-40 disabled:hover:scale-100 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
