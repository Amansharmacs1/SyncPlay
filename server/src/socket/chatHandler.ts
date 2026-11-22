import { ChatMessage } from '../types/index.js';
import { ChatMessageModel } from '../models/ChatMessage.js';
import { generateMessageId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';

export class ChatHandler {
  // In-memory message history buffer (last 100 messages per room)
  private static messageHistory: Map<string, ChatMessage[]> = new Map();
  // Rate limiting map: participantId -> timestamps of recent messages
  private static rateLimits: Map<string, number[]> = new Map();

  /**
   * Basic HTML entity sanitization
   */
  public static sanitize(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Rate limiting check: max 5 messages in 3 seconds
   */
  public static checkRateLimit(participantId: string): boolean {
    const now = Date.now();
    const windowMs = 3000;
    const maxMessages = 5;

    let timestamps = this.rateLimits.get(participantId) || [];
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxMessages) {
      return false; // Rate limited
    }

    timestamps.push(now);
    this.rateLimits.set(participantId, timestamps);
    return true;
  }

  /**
   * Creates a user message
   */
  public static async createMessage(params: {
    roomId: string;
    senderId: string;
    senderName: string;
    message: string;
  }): Promise<ChatMessage | null> {
    const trimmed = params.message.trim();
    if (!trimmed || trimmed.length > 1000) {
      return null;
    }

    if (!this.checkRateLimit(params.senderId)) {
      throw new Error('You are sending messages too quickly. Please slow down.');
    }

    const sanitizedMessage = this.sanitize(trimmed);
    const chatMsg: ChatMessage = {
      id: generateMessageId(),
      roomId: params.roomId.toUpperCase(),
      senderId: params.senderId,
      senderName: params.senderName,
      message: sanitizedMessage,
      timestamp: Date.now(),
      isSystem: false,
    };

    this.pushToHistory(params.roomId, chatMsg);

    // Save to DB asynchronously if connected
    if (mongoose.connection.readyState === 1) {
      ChatMessageModel.create(chatMsg).catch((err) =>
        console.error('[ChatHandler] Error persisting message to MongoDB:', err)
      );
    }

    return chatMsg;
  }

  /**
   * Creates a system message (e.g. joined, left, changed media)
   */
  public static createSystemMessage(roomId: string, message: string): ChatMessage {
    const chatMsg: ChatMessage = {
      id: generateMessageId(),
      roomId: roomId.toUpperCase(),
      senderId: 'system',
      senderName: 'SyncPlay',
      message: this.sanitize(message),
      timestamp: Date.now(),
      isSystem: true,
    };

    this.pushToHistory(roomId, chatMsg);
    return chatMsg;
  }

  /**
   * Gets message history for a room
   */
  public static async getHistory(roomId: string): Promise<ChatMessage[]> {
    const norm = roomId.toUpperCase();
    if (this.messageHistory.has(norm)) {
      return this.messageHistory.get(norm) || [];
    }

    // Fallback to DB if connected
    if (mongoose.connection.readyState === 1) {
      const dbMessages = await ChatMessageModel.find({ roomId: norm })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();

      const formatted: ChatMessage[] = dbMessages.reverse().map((m) => ({
        id: (m as any).id || (m as any)._id?.toString() || generateMessageId(),
        roomId: m.roomId,
        senderId: m.senderId,
        senderName: m.senderName,
        message: m.message,
        timestamp: m.timestamp,
        isSystem: m.isSystem,
      }));

      this.messageHistory.set(norm, formatted);
      return formatted;
    }

    return [];
  }

  private static pushToHistory(roomId: string, msg: ChatMessage): void {
    const norm = roomId.toUpperCase();
    const history = this.messageHistory.get(norm) || [];
    history.push(msg);
    if (history.length > 100) {
      history.shift();
    }
    this.messageHistory.set(norm, history);
  }
}
