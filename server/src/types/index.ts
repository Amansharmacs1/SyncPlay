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
  lastUpdated: number; // Unix timestamp in ms
  playbackRate: number;
}

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'reconnecting';

export interface ParticipantMediaStatus {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  callConnected: boolean;
  connectionQuality?: ConnectionQuality;
}

export interface Participant {
  id: string; // Persistent user/participant session ID (NOT an account)
  socketId: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  avatarSeed: string;
  // WebRTC call status
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
  expiresAt?: number;
}

// WebRTC Signaling Payloads
export interface WebRtcJoinPayload {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
}

export interface WebRtcOfferPayload {
  targetParticipantId: string;
  offer: {
    type: 'offer';
    sdp: string;
  };
}

export interface WebRtcAnswerPayload {
  targetParticipantId: string;
  answer: {
    type: 'answer';
    sdp: string;
  };
}

export interface WebRtcCandidatePayload {
  targetParticipantId: string;
  candidate: {
    candidate: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    usernameFragment?: string | null;
  };
}

export interface MediaStatusPayload {
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  screenSharing?: boolean;
  connectionQuality?: ConnectionQuality;
}

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

// Socket.io Client to Server Events
export interface ClientToServerEvents {
  // Room & Playback
  'room:join': (payload: { roomId: string; participantId: string; name: string; password?: string }) => void;
  'room:leave': () => void;
  'media:change': (payload: { media: MediaState }) => void;
  'playback:play': (payload: { currentTime: number; timestamp?: number }) => void;
  'playback:pause': (payload: { currentTime: number; timestamp?: number }) => void;
  'playback:seek': (payload: { currentTime: number; timestamp?: number }) => void;
  'playback:request-sync': () => void;
  'playback:ended': () => void;
  'chat:send': (payload: { message: string }) => void;
  'chat:reaction': (payload: { messageId: string; emoji: string }) => void;
  'participant:kick': (payload: { participantId: string }) => void;
  'room:end': () => void;
  'room:update-settings': (payload: {
    roomName?: string;
    password?: string;
    removePassword?: boolean;
    isLocked?: boolean;
    allowParticipantControl?: boolean;
    visibility?: 'public' | 'private';
  }) => void;

  // Queue Events
  'queue:add': (payload: { media: MediaState }) => void;
  'queue:remove': (payload: { itemId: string }) => void;
  'queue:play': (payload: { itemId: string }) => void;
  'queue:reorder': (payload: { itemIds: string[] }) => void;

  // WebRTC Signaling
  'webrtc:join': (payload: WebRtcJoinPayload) => void;
  'webrtc:leave': () => void;
  'webrtc:offer': (payload: WebRtcOfferPayload) => void;
  'webrtc:answer': (payload: WebRtcAnswerPayload) => void;
  'webrtc:ice-candidate': (payload: WebRtcCandidatePayload) => void;
  'media:camera-status': (payload: { enabled: boolean }) => void;
  'media:microphone-status': (payload: { enabled: boolean }) => void;
  'media:screen-share-status': (payload: { sharing: boolean }) => void;
  'media:connection-quality': (payload: { quality: ConnectionQuality }) => void;
}

// Socket.io Server to Client Events
export interface ServerToClientEvents {
  // Room & Playback
  'room:state': (room: RoomData) => void;
  'room:error': (error: { message: string; code?: string }) => void;
  'room:closed': (payload: { reason: string }) => void;
  'media:updated': (media: MediaState) => void;
  'playback:state': (state: PlaybackState) => void;
  'playback:sync': (state: PlaybackState) => void;
  'participants:update': (participants: Participant[]) => void;
  'chat:message': (message: ChatMessage) => void;
  'chat:history': (messages: ChatMessage[]) => void;
  'chat:reaction-updated': (payload: { messageId: string; reactions: Record<string, string[]> }) => void;
  'sync:heartbeat': (state: PlaybackState) => void;
  'queue:update': (queue: QueueItem[]) => void;
  'room:settings-updated': (settings: RoomSettings) => void;
  'room:host-changed': (payload: { hostId: string }) => void;

  // WebRTC Signaling
  'webrtc:participant-joined': (payload: {
    participantId: string;
    name: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
  }) => void;
  'webrtc:participant-left': (payload: { participantId: string }) => void;
  'webrtc:offer': (payload: {
    fromParticipantId: string;
    offer: { type: 'offer'; sdp: string };
  }) => void;
  'webrtc:answer': (payload: {
    fromParticipantId: string;
    answer: { type: 'answer'; sdp: string };
  }) => void;
  'webrtc:ice-candidate': (payload: {
    fromParticipantId: string;
    candidate: {
      candidate: string;
      sdpMid?: string | null;
      sdpMLineIndex?: number | null;
      usernameFragment?: string | null;
    };
  }) => void;
  'media:participant-status': (payload: {
    participantId: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
    connectionQuality?: ConnectionQuality;
  }) => void;
  'webrtc:call-participants': (payload: {
    participants: Array<{
      participantId: string;
      name: string;
      cameraEnabled: boolean;
      microphoneEnabled: boolean;
      screenSharing: boolean;
      connectionQuality?: ConnectionQuality;
    }>;
  }) => void;
}
