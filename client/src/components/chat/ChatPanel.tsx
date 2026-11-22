import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { socketService } from '../../services/socket.js';
import { ChatMessageItem } from './ChatMessageItem.js';
import { Send, MessageSquare, ArrowDown } from 'lucide-react';

const QUICK_EMOJIS = ['🔥', '❤️', '😂', '👏', '🍿', '😮', '🎉'];

export const ChatPanel: React.FC = () => {
  const { messages, resetUnreadCount } = useRoomStore();
  const [inputText, setInputText] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSendTimesRef = useRef<number[]>([]);

  // Clear unread on mount or when chat is focused
  useEffect(() => {
    resetUnreadCount();
  }, [resetUnreadCount]);

  // Check scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isClose = distanceFromBottom < 80;
    setIsNearBottom(isClose);
    setShowScrollBottomBtn(!isClose);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setShowScrollBottomBtn(false);
    setIsNearBottom(true);
  }, []);

  // Smart auto-scroll: only scroll if user was already at or near bottom
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom(true);
    } else {
      setShowScrollBottomBtn(true);
    }
  }, [messages, isNearBottom, scrollToBottom]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    if (clean.length > 500) {
      setRateLimitError('Message exceeds maximum length (500 chars).');
      setTimeout(() => setRateLimitError(null), 3000);
      return;
    }

    // Client-side rate limiting: max 5 messages in 3 seconds
    const now = Date.now();
    const recent = lastSendTimesRef.current.filter((t) => now - t < 3000);
    if (recent.length >= 5) {
      setRateLimitError('Sending too fast. Please slow down.');
      setTimeout(() => setRateLimitError(null), 3000);
      return;
    }

    lastSendTimesRef.current = [...recent, now];
    socketService.sendMessage(clean);
    setInputText('');
    setRateLimitError(null);
    scrollToBottom(true);
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
    <div className="relative flex flex-col h-full apple-card overflow-hidden bg-white">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-[#D2D2D7]/50 bg-[#F5F5F7]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0071E3]" />
          <h2 className="text-xs font-semibold tracking-tight text-[#1D1D1F]">Messages</h2>
        </div>
        <span className="text-[11px] text-[#86868B]">{messages.length} messages</span>
      </div>

      {/* Messages List Area with smart scroll tracking */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] bg-white"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#86868B]">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-[#0071E3]" />
            <p className="text-xs font-medium text-[#1D1D1F]">No messages yet</p>
            <p className="text-[11px] text-[#86868B] mt-0.5">Send a message to start chatting</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}
      </div>

      {/* Floating Jump to Latest Button */}
      {showScrollBottomBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-4 z-10 px-3 py-1.5 rounded-full bg-[#0071E3] text-white text-xs font-medium shadow-apple-float flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>New messages</span>
        </button>
      )}

      {/* Rate limit / Error Alert */}
      {rateLimitError && (
        <div className="px-4 py-1.5 bg-[#FFF2F0] border-t border-[#FF3B30]/20 text-[11px] text-[#FF3B30] font-medium">
          {rateLimitError}
        </div>
      )}

      {/* Quick Emoji Bar */}
      <div className="px-3 py-1.5 border-t border-[#D2D2D7]/40 bg-[#F5F5F7]/60 flex items-center gap-1.5 overflow-x-auto">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => addEmoji(emoji)}
            className="text-sm p-1 rounded-full hover:bg-[#E8E8ED] transition-transform hover:scale-125 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form - Apple Messages Style */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[#D2D2D7]/50 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          maxLength={500}
          placeholder="iMessage..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full px-4 py-2 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-full bg-[#0071E3] text-white flex items-center justify-center hover:bg-[#0077ED] disabled:opacity-30 disabled:hover:scale-100 transition-all cursor-pointer flex-shrink-0 shadow-sm"
        >
          <Send className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
