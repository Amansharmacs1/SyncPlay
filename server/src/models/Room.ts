import mongoose, { Schema, Document } from 'mongoose';
import { MediaState, PlaybackState } from '../types/index.js';

export interface IRoomDoc extends Document {
  roomId: string;
  roomName: string;
  hostId: string;
  passwordHash?: string;
  visibility: 'public' | 'private';
  media: MediaState;
  playbackState: PlaybackState;
  createdAt: Date;
  expiresAt: Date;
}

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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      // Default expiration: 24 hours after creation
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: '1s' }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

export const RoomModel = mongoose.model<IRoomDoc>('Room', RoomSchema);
