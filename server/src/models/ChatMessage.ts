import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessageDoc extends Document {
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

const ChatMessageSchema: Schema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Number,
      required: true,
      default: () => Date.now(),
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire chat messages after 24 hours
ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const ChatMessageModel = mongoose.model<IChatMessageDoc>('ChatMessage', ChatMessageSchema);
