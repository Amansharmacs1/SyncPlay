import { Socket } from 'socket.io-client';
import { MediaManager } from './MediaManager.js';
import { ScreenShareManager } from './ScreenShareManager.js';
import { SignalingService } from './SignalingService.js';
import { PeerConnection } from './PeerConnection.js';
import {
  CallJoinOption,
  DeviceSettings,
  IceServerConfig,
  MediaQualityPreset,
} from './types.js';
import { useCallStore } from '../../stores/useCallStore.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { useToastStore } from '../../stores/useToastStore.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class WebRTCManager {
  private static instance: WebRTCManager | null = null;

  private mediaManager: MediaManager;
  private screenShareManager: ScreenShareManager;
  private signalingService: SignalingService;
  private peers: Map<string, PeerConnection> = new Map();
  private iceServers: IceServerConfig[] = [];
  private remoteAudioContexts: Map<string, AudioContext> = new Map();
  private remoteAudioIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  private constructor() {
    this.mediaManager = new MediaManager();
    this.screenShareManager = new ScreenShareManager();
    this.signalingService = new SignalingService();
  }

  public static getInstance(): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager();
    }
    return WebRTCManager.instance;
  }

  /**
   * Initialize signaling with Socket.IO socket instance.
   */
  public initializeSignaling(socket: Socket): void {
    this.signalingService.initialize(socket, {
      onParticipantJoined: (payload) => this.handleParticipantJoined(payload),
      onParticipantLeft: (payload) => this.handleParticipantLeft(payload),
      onCallParticipants: (payload) => this.handleCallParticipants(payload),
      onOffer: (payload) => this.handleOffer(payload),
      onAnswer: (payload) => this.handleAnswer(payload),
      onIceCandidate: (payload) => this.handleIceCandidate(payload),
      onMediaStatus: (payload) => this.handleMediaStatus(payload),
    });
  }

  /**
   * Fetch ICE servers dynamically from backend configuration.
   */
  public async fetchIceServers(): Promise<IceServerConfig[]> {
    if (this.iceServers.length > 0) return this.iceServers;

    try {
      const res = await fetch(`${API_BASE}/webrtc/ice-servers`);
      const data = await res.json();
      if (data.success && data.data?.iceServers) {
        this.iceServers = data.data.iceServers;
        return this.iceServers;
      }
    } catch (err) {
      console.warn('[WebRTCManager] Failed to fetch ICE servers from backend. Using default STUN.', err);
    }

    // Default public STUN fallback
    this.iceServers = [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ];
    return this.iceServers;
  }

  /**
   * Join real-time video/voice call.
   */
  public async joinCall(
    joinOption: CallJoinOption,
    customSettings?: Partial<DeviceSettings>
  ): Promise<void> {
    useCallStore.getState().setIsJoining(true);

    try {
      await this.fetchIceServers();

      const wantCamera = joinOption === 'camera-and-mic';
      const wantMic = joinOption === 'camera-and-mic' || joinOption === 'mic-only';

      const settings: DeviceSettings = {
        qualityPreset: customSettings?.qualityPreset || useCallStore.getState().qualityPreset,
        audioInputId: customSettings?.audioInputId || useCallStore.getState().selectedAudioInput || undefined,
        videoInputId: customSettings?.videoInputId || useCallStore.getState().selectedVideoInput || undefined,
      };

      let stream: MediaStream | null = null;
      if (wantCamera || wantMic) {
        try {
          stream = await this.mediaManager.getUserMedia(wantMic, wantCamera, settings);
        } catch (mediaErr: any) {
          useToastStore.getState().addToast(mediaErr.message, 'error');
          // If media failed, continue joining in listen-only mode
        }
      }

      useCallStore.getState().setLocalStream(stream);
      useCallStore.getState().setCameraEnabled(wantCamera);
      useCallStore.getState().setMicrophoneEnabled(wantMic);
      useCallStore.getState().setInCall(true);

      // Start local audio level monitoring for voice activity
      if (stream && wantMic) {
        const myId = useRoomStore.getState().participantId;
        this.mediaManager.startAudioLevelMonitoring(stream, (level) => {
          if (level > 0.15) {
            useCallStore.getState().setActiveSpeakerId(myId);
          }
        });
      }

      // Enumerate connected devices for settings modal
      const devices = await this.mediaManager.enumerateDevices();
      useCallStore.getState().setAvailableDevices(devices);

      // Emit join call via Socket.IO
      this.signalingService.joinCall(wantCamera, wantMic);
      useToastStore.getState().addToast('Connected to video call', 'success');
    } catch (err: any) {
      console.error('[WebRTCManager] Failed to join call:', err);
      useToastStore.getState().addToast(err.message || 'Failed to join call', 'error');
      this.leaveCall();
    } finally {
      useCallStore.getState().setIsJoining(false);
    }
  }

  /**
   * Leave real-time video/voice call (preserves watch room membership).
   */
  public leaveCall(): void {
    // 1. Notify signaling server
    this.signalingService.leaveCall();

    // 2. Stop screen share if active
    this.screenShareManager.stopScreenShare();

    // 3. Stop local media tracks
    this.mediaManager.stopLocalStream();

    // 4. Close all peer connections
    this.peers.forEach((peer) => {
      peer.close();
    });
    this.peers.clear();

    // 5. Clean up remote audio analyzers
    this.remoteAudioIntervals.forEach((interval) => clearInterval(interval));
    this.remoteAudioIntervals.clear();
    this.remoteAudioContexts.forEach((ctx) => ctx.close().catch(() => {}));
    this.remoteAudioContexts.clear();

    // 6. Reset call store
    useCallStore.getState().resetCall();
    useToastStore.getState().addToast('Left video call', 'info');
  }

  /**
   * Toggle camera on/off.
   */
  public async toggleCamera(): Promise<void> {
    const { cameraEnabled, localStream, qualityPreset, selectedVideoInput } = useCallStore.getState();
    const nextState = !cameraEnabled;

    if (!localStream) {
      // If no local stream exists, request camera
      try {
        const stream = await this.mediaManager.getUserMedia(true, true, {
          qualityPreset,
          videoInputId: selectedVideoInput || undefined,
        });
        useCallStore.getState().setLocalStream(stream);
        this.peers.forEach((peer) => peer.addTracks(stream));
      } catch (err: any) {
        useToastStore.getState().addToast(err.message, 'error');
        return;
      }
    } else {
      const hasVideoTrack = localStream.getVideoTracks().length > 0;
      if (!hasVideoTrack && nextState) {
        // Need to acquire video track
        try {
          const videoTrack = await this.mediaManager.switchVideoInput(selectedVideoInput, qualityPreset);
          if (videoTrack) {
            this.peers.forEach((peer) => peer.replaceVideoTrack(videoTrack));
          }
        } catch (err: any) {
          useToastStore.getState().addToast(err.message, 'error');
          return;
        }
      } else {
        this.mediaManager.setCameraEnabled(nextState);
      }
    }

    useCallStore.getState().setCameraEnabled(nextState);
    this.signalingService.updateCameraStatus(nextState);
  }

  /**
   * Toggle microphone on/off.
   */
  public async toggleMicrophone(): Promise<void> {
    const { microphoneEnabled, localStream, qualityPreset, selectedAudioInput } = useCallStore.getState();
    const nextState = !microphoneEnabled;

    if (!localStream) {
      try {
        const stream = await this.mediaManager.getUserMedia(true, false, {
          qualityPreset,
          audioInputId: selectedAudioInput || undefined,
        });
        useCallStore.getState().setLocalStream(stream);
        this.peers.forEach((peer) => peer.addTracks(stream));
      } catch (err: any) {
        useToastStore.getState().addToast(err.message, 'error');
        return;
      }
    } else {
      this.mediaManager.setMicrophoneEnabled(nextState);
    }

    useCallStore.getState().setMicrophoneEnabled(nextState);
    this.signalingService.updateMicrophoneStatus(nextState);
  }

  /**
   * Toggle screen sharing.
   */
  public async toggleScreenShare(): Promise<void> {
    const { isScreenSharing, localStream } = useCallStore.getState();

    if (isScreenSharing) {
      this.stopScreenShare();
      return;
    }

    try {
      const screenStream = await this.screenShareManager.startScreenShare(() => {
        this.stopScreenShare();
      });

      useCallStore.getState().setScreenStream(screenStream);
      useCallStore.getState().setIsScreenSharing(true);
      this.signalingService.updateScreenShareStatus(true);

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        // Replace video track in all active peer connections
        this.peers.forEach((peer) => {
          peer.replaceVideoTrack(screenVideoTrack);
        });
      }

      useToastStore.getState().addToast('Screen sharing started', 'info');
    } catch (err: any) {
      useToastStore.getState().addToast(err.message, 'error');
    }
  }

  /**
   * Stop screen sharing and restore camera.
   */
  public stopScreenShare(): void {
    if (!useCallStore.getState().isScreenSharing) return;

    this.screenShareManager.stopScreenShare();
    useCallStore.getState().setScreenStream(null);
    useCallStore.getState().setIsScreenSharing(false);
    this.signalingService.updateScreenShareStatus(false);

    // Restore camera video track
    const cameraTrack = this.mediaManager.getLocalStream()?.getVideoTracks()[0] || null;
    this.peers.forEach((peer) => {
      peer.replaceVideoTrack(cameraTrack);
    });

    useToastStore.getState().addToast('Screen sharing ended', 'info');
  }

  /**
   * Switch audio input device.
   */
  public async switchAudioDevice(deviceId: string): Promise<void> {
    try {
      const newTrack = await this.mediaManager.switchAudioInput(deviceId);
      if (newTrack) {
        this.peers.forEach((peer) => peer.replaceAudioTrack(newTrack));
        useCallStore.getState().setSelectedAudioInput(deviceId);
        useToastStore.getState().addToast('Switched microphone', 'info');
      }
    } catch (err: any) {
      useToastStore.getState().addToast('Failed to switch microphone: ' + err.message, 'error');
    }
  }

  /**
   * Switch video input device.
   */
  public async switchVideoDevice(deviceId: string): Promise<void> {
    const { qualityPreset } = useCallStore.getState();
    try {
      const newTrack = await this.mediaManager.switchVideoInput(deviceId, qualityPreset);
      if (newTrack) {
        if (!useCallStore.getState().isScreenSharing) {
          this.peers.forEach((peer) => peer.replaceVideoTrack(newTrack));
        }
        useCallStore.getState().setSelectedVideoInput(deviceId);
        useToastStore.getState().addToast('Switched camera', 'info');
      }
    } catch (err: any) {
      useToastStore.getState().addToast('Failed to switch camera: ' + err.message, 'error');
    }
  }

  /**
   * Change quality preset.
   */
  public setQualityPreset(preset: MediaQualityPreset): void {
    useCallStore.getState().setQualityPreset(preset);
    const { selectedVideoInput } = useCallStore.getState();
    if (selectedVideoInput) {
      this.switchVideoDevice(selectedVideoInput);
    }
  }

  // --- Internal Signaling Handlers ---

  /**
   * Received when another participant joins the video call.
   */
  private async handleParticipantJoined(payload: {
    participantId: string;
    name: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
  }): Promise<void> {
    console.log(`[WebRTCManager] New peer joined call: ${payload.name} (${payload.participantId})`);

    useCallStore.getState().upsertCallParticipant(payload.participantId, {
      name: payload.name,
      cameraEnabled: payload.cameraEnabled,
      microphoneEnabled: payload.microphoneEnabled,
      screenSharing: payload.screenSharing,
    });

    // Establish peer connection. Since we were already here, we create the offer (polite = false)
    const peer = this.createPeerConnection(payload.participantId, false);
    const offer = await peer.createOffer();
    this.signalingService.sendOffer(payload.participantId, offer);
  }

  /**
   * Received on initial join: list of all existing participants in the call.
   */
  private handleCallParticipants(payload: {
    participants: Array<{
      participantId: string;
      name: string;
      cameraEnabled: boolean;
      microphoneEnabled: boolean;
      screenSharing: boolean;
      connectionQuality?: any;
    }>;
  }): void {
    console.log(`[WebRTCManager] Received existing call participants:`, payload.participants.length);

    payload.participants.forEach((p) => {
      useCallStore.getState().upsertCallParticipant(p.participantId, {
        name: p.name,
        cameraEnabled: p.cameraEnabled,
        microphoneEnabled: p.microphoneEnabled,
        screenSharing: p.screenSharing,
        connectionQuality: p.connectionQuality || 'excellent',
      });

      // We are the joiner, so we expect offers from existing peers (polite = true)
      this.createPeerConnection(p.participantId, true);
    });
  }

  /**
   * Received when a peer leaves the call.
   */
  private handleParticipantLeft(payload: { participantId: string }): void {
    console.log(`[WebRTCManager] Peer left call: ${payload.participantId}`);
    const peer = this.peers.get(payload.participantId);
    if (peer) {
      peer.close();
      this.peers.delete(payload.participantId);
    }

    this.stopRemoteAudioMonitoring(payload.participantId);
    useCallStore.getState().removeCallParticipant(payload.participantId);
  }

  /**
   * Handle incoming WebRTC Offer.
   */
  private async handleOffer(payload: {
    fromParticipantId: string;
    offer: { type: 'offer'; sdp: string };
  }): Promise<void> {
    let peer = this.peers.get(payload.fromParticipantId);
    if (!peer) {
      peer = this.createPeerConnection(payload.fromParticipantId, true);
    }

    const answer = await peer.handleOffer(payload.offer);
    if (answer) {
      this.signalingService.sendAnswer(payload.fromParticipantId, answer);
    }
  }

  /**
   * Handle incoming WebRTC Answer.
   */
  private async handleAnswer(payload: {
    fromParticipantId: string;
    answer: { type: 'answer'; sdp: string };
  }): Promise<void> {
    const peer = this.peers.get(payload.fromParticipantId);
    if (peer) {
      await peer.handleAnswer(payload.answer);
    }
  }

  /**
   * Handle incoming remote ICE Candidate.
   */
  private async handleIceCandidate(payload: {
    fromParticipantId: string;
    candidate: any;
  }): Promise<void> {
    const peer = this.peers.get(payload.fromParticipantId);
    if (peer) {
      await peer.addIceCandidate(payload.candidate);
    }
  }

  /**
   * Handle peer media status change (camera, mic, screenshare).
   */
  private handleMediaStatus(payload: {
    participantId: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
    connectionQuality?: any;
  }): void {
    useCallStore.getState().upsertCallParticipant(payload.participantId, {
      cameraEnabled: payload.cameraEnabled,
      microphoneEnabled: payload.microphoneEnabled,
      screenSharing: payload.screenSharing,
      connectionQuality: payload.connectionQuality,
    });
  }

  /**
   * Factory for creating and registering a PeerConnection instance.
   */
  private createPeerConnection(peerId: string, isPolite: boolean): PeerConnection {
    // If connection already exists, clean up first
    if (this.peers.has(peerId)) {
      this.peers.get(peerId)?.close();
      this.peers.delete(peerId);
    }

    const peer = new PeerConnection(peerId, isPolite, this.iceServers, {
      onRemoteStream: (stream) => {
        console.log(`[WebRTCManager] Setting remote stream for peer: ${peerId}`);
        useCallStore.getState().upsertCallParticipant(peerId, { stream });
        this.startRemoteAudioMonitoring(peerId, stream);
      },
      onIceCandidate: (candidate) => {
        this.signalingService.sendIceCandidate(peerId, candidate);
      },
      onConnectionQuality: (quality) => {
        useCallStore.getState().upsertCallParticipant(peerId, { connectionQuality: quality });
      },
      onConnectionStateChange: (state) => {
        if (state === 'closed' || state === 'failed') {
          // Handled via ICE restart or cleanup
        }
      },
      onNegotiationNeeded: async () => {
        try {
          const offer = await peer.createOffer();
          this.signalingService.sendOffer(peerId, offer);
        } catch (err) {
          console.warn(`[WebRTCManager] Negotiation failed for ${peerId}:`, err);
        }
      },
    });

    // Attach local media or screen share tracks to the new peer connection
    const activeScreenStream = this.screenShareManager.getScreenStream();
    const activeLocalStream = this.mediaManager.getLocalStream();

    if (activeScreenStream) {
      peer.addTracks(activeScreenStream);
    } else if (activeLocalStream) {
      peer.addTracks(activeLocalStream);
    }

    this.peers.set(peerId, peer);
    return peer;
  }

  /**
   * Start audio analysis on remote peer stream to detect active speaker.
   */
  private startRemoteAudioMonitoring(peerId: string, stream: MediaStream): void {
    this.stopRemoteAudioMonitoring(peerId);

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        const normalized = Math.min(1, average / 128);

        useCallStore.getState().updateParticipantAudioLevel(peerId, normalized);
      }, 150);

      this.remoteAudioContexts.set(peerId, ctx);
      this.remoteAudioIntervals.set(peerId, interval);
    } catch (err) {
      console.warn(`[WebRTCManager] Remote audio monitoring error for ${peerId}:`, err);
    }
  }

  private stopRemoteAudioMonitoring(peerId: string): void {
    const interval = this.remoteAudioIntervals.get(peerId);
    if (interval) {
      clearInterval(interval);
      this.remoteAudioIntervals.delete(peerId);
    }
    const ctx = this.remoteAudioContexts.get(peerId);
    if (ctx) {
      ctx.close().catch(() => {});
      this.remoteAudioContexts.delete(peerId);
    }
  }

  public getMediaManager(): MediaManager {
    return this.mediaManager;
  }

  public getSignalingService(): SignalingService {
    return this.signalingService;
  }
}

export const webrtcManager = WebRTCManager.getInstance();
