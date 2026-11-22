import { Socket } from 'socket.io-client';
import { ConnectionQuality } from './types.js';

export interface SignalingCallbacks {
  onParticipantJoined: (payload: {
    participantId: string;
    name: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
  }) => void;
  onParticipantLeft: (payload: { participantId: string }) => void;
  onCallParticipants: (payload: {
    participants: Array<{
      participantId: string;
      name: string;
      cameraEnabled: boolean;
      microphoneEnabled: boolean;
      screenSharing: boolean;
      connectionQuality?: ConnectionQuality;
    }>;
  }) => void;
  onOffer: (payload: {
    fromParticipantId: string;
    offer: { type: 'offer'; sdp: string };
  }) => void;
  onAnswer: (payload: {
    fromParticipantId: string;
    answer: { type: 'answer'; sdp: string };
  }) => void;
  onIceCandidate: (payload: {
    fromParticipantId: string;
    candidate: {
      candidate: string;
      sdpMid?: string | null;
      sdpMLineIndex?: number | null;
      usernameFragment?: string | null;
    };
  }) => void;
  onMediaStatus: (payload: {
    participantId: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
    connectionQuality?: ConnectionQuality;
  }) => void;
}

export class SignalingService {
  private socket: Socket | null = null;
  private callbacks: SignalingCallbacks | null = null;

  public initialize(socket: Socket, callbacks: SignalingCallbacks): void {
    this.socket = socket;
    this.callbacks = callbacks;
    this.registerListeners();
  }

  private registerListeners(): void {
    if (!this.socket || !this.callbacks) return;

    this.socket.on('webrtc:participant-joined', (payload) => {
      this.callbacks?.onParticipantJoined(payload);
    });

    this.socket.on('webrtc:participant-left', (payload) => {
      this.callbacks?.onParticipantLeft(payload);
    });

    this.socket.on('webrtc:call-participants', (payload) => {
      this.callbacks?.onCallParticipants(payload);
    });

    this.socket.on('webrtc:offer', (payload) => {
      this.callbacks?.onOffer(payload);
    });

    this.socket.on('webrtc:answer', (payload) => {
      this.callbacks?.onAnswer(payload);
    });

    this.socket.on('webrtc:ice-candidate', (payload) => {
      this.callbacks?.onIceCandidate(payload);
    });

    this.socket.on('media:participant-status', (payload) => {
      this.callbacks?.onMediaStatus(payload);
    });
  }

  public joinCall(cameraEnabled: boolean, microphoneEnabled: boolean): void {
    if (!this.socket) return;
    this.socket.emit('webrtc:join', { cameraEnabled, microphoneEnabled });
  }

  public leaveCall(): void {
    if (!this.socket) return;
    this.socket.emit('webrtc:leave');
  }

  public sendOffer(targetParticipantId: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket) return;
    this.socket.emit('webrtc:offer', {
      targetParticipantId,
      offer: { type: 'offer', sdp: offer.sdp || '' },
    });
  }

  public sendAnswer(targetParticipantId: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket) return;
    this.socket.emit('webrtc:answer', {
      targetParticipantId,
      answer: { type: 'answer', sdp: answer.sdp || '' },
    });
  }

  public sendIceCandidate(targetParticipantId: string, candidate: RTCIceCandidate): void {
    if (!this.socket) return;
    this.socket.emit('webrtc:ice-candidate', {
      targetParticipantId,
      candidate: candidate.toJSON(),
    });
  }

  public updateCameraStatus(enabled: boolean): void {
    if (!this.socket) return;
    this.socket.emit('media:camera-status', { enabled });
  }

  public updateMicrophoneStatus(enabled: boolean): void {
    if (!this.socket) return;
    this.socket.emit('media:microphone-status', { enabled });
  }

  public updateScreenShareStatus(sharing: boolean): void {
    if (!this.socket) return;
    this.socket.emit('media:screen-share-status', { sharing });
  }

  public updateConnectionQuality(quality: ConnectionQuality): void {
    if (!this.socket) return;
    this.socket.emit('media:connection-quality', { quality });
  }

  public endRoom(): void {
    if (!this.socket) return;
    this.socket.emit('room:end');
  }
}
