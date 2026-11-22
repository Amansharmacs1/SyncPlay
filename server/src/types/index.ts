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
  id: string; // Persistent user/participant session ID
  socketId: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  avatarSeed: string;
  // Phase 2 WebRTC call status
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
}

export interface RoomData {
  roomId: string;
  roomName: string;
  hostId: string;
  hasPassword?: boolean;
  visibility: 'public' | 'private';
  media: MediaState;
  playbackState: PlaybackState;
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
  'chat:send': (payload: { message: string }) => void;
  'participant:kick': (payload: { participantId: string }) => void;
  'room:end': () => void;

  // WebRTC Phase 2 Signaling
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
  'sync:heartbeat': (state: PlaybackState) => void;

  // WebRTC Phase 2 Signaling
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
