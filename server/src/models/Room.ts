import mongoose, { Schema, Document } from 'mongoose';
import { MediaState, PlaybackState, QueueItem } from '../types/index.js';

export interface IRoomDoc extends Document {
  roomId: string;
  roomName: string;
  hostId: string;
  passwordHash?: string;
  visibility: 'public' | 'private';
  isLocked: boolean;
  allowParticipantControl: boolean;
  media: MediaState;
  playbackState: PlaybackState;
  queue: QueueItem[];
  createdAt: Date;
  expiresAt: Date;
}

const QueueItemSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['youtube', 'direct'], required: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: Number, default: 0 },
    addedBy: { type: String, required: true },
    addedById: { type: String, required: true },
    addedAt: { type: Number, default: () => Date.now() },
  },
  { _id: false }
);

const RoomSchema: Schema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      default: 'Watch Party',
    },
    hostId: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    allowParticipantControl: {
      type: Boolean,
      default: true,
    },
    media: {
      type: {
        type: String,
        enum: ['youtube', 'direct'],
        default: 'youtube',
      },
      url: {
        type: String,
        default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      title: {
        type: String,
        default: 'Welcome to SyncPlay',
      },
      duration: {
        type: Number,
        default: 0,
      },
    },
    playbackState: {
      status: {
        type: String,
        enum: ['playing', 'paused', 'buffering', 'idle'],
        default: 'paused',
      },
      currentTime: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Number,
        default: () => Date.now(),
      },
      playbackRate: {
        type: Number,
        default: 1,
      },
    },
    queue: {
      type: [QueueItemSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: '1s' }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

export const RoomModel = mongoose.model<IRoomDoc>('Room', RoomSchema);
