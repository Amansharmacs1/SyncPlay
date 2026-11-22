import { ConnectionQuality, IceServerConfig } from './types.js';

export interface PeerConnectionCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionQuality: (quality: ConnectionQuality) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onNegotiationNeeded: () => void;
}

export class PeerConnection {
  public readonly peerId: string;
  private pc: RTCPeerConnection;
  private callbacks: PeerConnectionCallbacks;
  private remoteStream: MediaStream;
  private candidateQueue: RTCIceCandidateInit[] = [];
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private isPolite: boolean;
  private isMakingOffer = false;

  constructor(
    peerId: string,
    isPolite: boolean,
    iceServers: IceServerConfig[],
    callbacks: PeerConnectionCallbacks
  ) {
    this.peerId = peerId;
    this.isPolite = isPolite;
    this.callbacks = callbacks;
    this.remoteStream = new MediaStream();

    this.pc = new RTCPeerConnection({
      iceServers: iceServers as RTCIceServer[],
      iceCandidatePoolSize: 2,
    });

    this.setupListeners();
    this.startStatsMonitoring();
  }

  private setupListeners(): void {
    // Remote track received
    this.pc.ontrack = (event) => {
      console.log(`[PeerConnection] Received remote track (${event.track.kind}) from ${this.peerId}`);
      if (event.streams && event.streams[0]) {
        this.callbacks.onRemoteStream(event.streams[0]);
      } else {
        this.remoteStream.addTrack(event.track);
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };

    // Local ICE candidate generated
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };

    // Connection state change
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      console.log(`[PeerConnection] Connection state with ${this.peerId}:`, state);
      this.callbacks.onConnectionStateChange(state);

      if (state === 'failed') {
        this.attemptIceRestart();
      }
    };

    // ICE connection state change
    this.pc.oniceconnectionstatechange = () => {
      const iceState = this.pc.iceConnectionState;
      if (iceState === 'disconnected' || iceState === 'checking') {
        this.callbacks.onConnectionQuality('reconnecting');
      } else if (iceState === 'failed') {
        this.attemptIceRestart();
      }
    };

    // Negotiation needed
    this.pc.onnegotiationneeded = () => {
      this.callbacks.onNegotiationNeeded();
    };
  }

  /**
   * Add local tracks from user media stream or screen share.
   */
  public addTracks(stream: MediaStream): void {
    stream.getTracks().forEach((track) => {
      try {
        const senders = this.pc.getSenders();
        const exists = senders.some((s) => s.track && s.track.kind === track.kind);
        if (!exists) {
          this.pc.addTrack(track, stream);
        }
      } catch (err) {
        console.warn(`[PeerConnection] Error adding track ${track.kind}:`, err);
      }
    });
  }

  /**
   * Replace active video track (e.g. switching to screen share or restoring camera).
   */
  public async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    const sender = this.pc.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  }

  /**
   * Replace active audio track (e.g. switching microphone device).
   */
  public async replaceAudioTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    const sender = this.pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  }

  /**
   * Create SDP Offer.
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      this.isMakingOffer = true;
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      return offer;
    } finally {
      this.isMakingOffer = false;
    }
  }

  /**
   * Handle incoming remote SDP Offer.
   */
  public async handleOffer(offer: { type: 'offer'; sdp: string }): Promise<RTCSessionDescriptionInit | null> {
    const offerCollision = this.isMakingOffer || this.pc.signalingState !== 'stable';

    if (offerCollision) {
      if (!this.isPolite) {
        console.warn(`[PeerConnection] Glare collision: rejecting offer from ${this.peerId} (impolite peer)`);
        return null;
      }
      console.log(`[PeerConnection] Glare collision: rolling back local offer for ${this.peerId} (polite peer)`);
      await this.pc.setLocalDescription({ type: 'rollback' });
    }

    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    await this.drainCandidateQueue();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Handle incoming remote SDP Answer.
   */
  public async handleAnswer(answer: { type: 'answer'; sdp: string }): Promise<void> {
    if (this.pc.signalingState === 'have-local-offer') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.drainCandidateQueue();
    }
  }

  /**
   * Add incoming remote ICE candidate. Buffers if remote description is not yet set.
   */
  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this.pc.remoteDescription || !this.pc.remoteDescription.type) {
      this.candidateQueue.push(candidateInit);
      return;
    }

    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (err) {
      console.warn(`[PeerConnection] Error adding ICE candidate:`, err);
    }
  }

  private async drainCandidateQueue(): Promise<void> {
    while (this.candidateQueue.length > 0) {
      const cand = this.candidateQueue.shift();
      if (cand) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn(`[PeerConnection] Error draining candidate:`, err);
        }
      }
    }
  }

  /**
   * Attempt ICE restart upon connection failure.
   */
  public async attemptIceRestart(): Promise<void> {
    console.log(`[PeerConnection] Attempting ICE restart with ${this.peerId}...`);
    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      // Trigger negotiation callback so WebRTCManager can send the restart offer
      this.callbacks.onNegotiationNeeded();
    } catch (err) {
      console.warn(`[PeerConnection] ICE restart failed:`, err);
    }
  }

  /**
   * Periodic stats inspection using getStats() to evaluate connection quality.
   */
  private startStatsMonitoring(): void {
    this.statsInterval = setInterval(async () => {
      if (this.pc.connectionState !== 'connected') return;

      try {
        const stats = await this.pc.getStats();
        let rtt: number | null = null;
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : null;
          }
          if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.kind === 'audio')) {
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
          }
        });

        const totalPackets = packetsLost + packetsReceived;
        const lossRate = totalPackets > 0 ? packetsLost / totalPackets : 0;

        let quality: ConnectionQuality = 'excellent';
        if (rtt !== null) {
          if (rtt > 300 || lossRate > 0.08) {
            quality = 'poor';
          } else if (rtt > 120 || lossRate > 0.02) {
            quality = 'good';
          }
        }

        this.callbacks.onConnectionQuality(quality);
      } catch (err) {
        // Silently ignore stats inspection errors
      }
    }, 2500);
  }

  /**
   * Destroy and clean up this peer connection.
   */
  public close(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    try {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.onnegotiationneeded = null;
      this.pc.close();
    } catch (err) {
      console.warn(`[PeerConnection] Error closing connection with ${this.peerId}:`, err);
    }
  }
}
