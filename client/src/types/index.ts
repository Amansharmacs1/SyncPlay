export type MediaType = 'youtube' | 'direct';

export interface MediaState {
  type: MediaType;
  url: string;
  title: string;
  duration?: number;
}

export type PlaybackStatus = 'playing' | 'paused' | 'buffering' | 'idle';

export interface PlaybackState {
  status: PlaybackStatus;
  currentTime: number;
  lastUpdated: number;
  playbackRate: number;
}

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'reconnecting';

export interface Participant {
  id: string; // Persistent user/participant session ID (NOT an account)
  socketId: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  avatarSeed: string;
  // WebRTC call metadata
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  screenSharing?: boolean;
  callConnected?: boolean;
  connectionQuality?: ConnectionQuality;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of participant IDs
}

export interface QueueItem {
  id: string;
  type: MediaType;
  url: string;
  title: string;
  duration?: number;
  addedBy: string;
  addedById: string;
  addedAt: number;
}

export interface RoomSettings {
  roomName: string;
  hasPassword: boolean;
  isLocked: boolean;
  allowParticipantControl: boolean;
  visibility: 'public' | 'private';
}

export interface RoomData {
  roomId: string;
  roomName: string;
  hostId: string;
  hasPassword?: boolean;
  isLocked?: boolean;
  allowParticipantControl?: boolean;
  visibility: 'public' | 'private';
  media: MediaState;
  playbackState: PlaybackState;
  queue: QueueItem[];
  participants: Participant[];
  createdAt: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error';
