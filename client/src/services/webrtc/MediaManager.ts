import { DeviceSettings, MediaDeviceInfoList, MediaQualityPreset } from './types.js';

export class MediaManager {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevelInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Enumerate connected cameras, microphones, and audio outputs.
   */
  public async enumerateDevices(): Promise<MediaDeviceInfoList> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter((d) => d.kind === 'audioinput'),
        videoInputs: devices.filter((d) => d.kind === 'videoinput'),
        audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      };
    } catch (err) {
      console.warn('[MediaManager] Failed to enumerate devices:', err);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }

  /**
   * Construct video constraints according to chosen quality preset.
   */
  public getVideoConstraints(preset: MediaQualityPreset, deviceId?: string): MediaTrackConstraints {
    const base: MediaTrackConstraints = deviceId ? { deviceId: { exact: deviceId } } : {};

    switch (preset) {
      case 'low':
        return {
          ...base,
          width: { ideal: 320, max: 480 },
          height: { ideal: 240, max: 360 },
          frameRate: { ideal: 15, max: 20 },
        };
      case 'high':
        return {
          ...base,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        };
      case 'balanced':
      default:
        return {
          ...base,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 },
        };
    }
  }

  /**
   * Request user media tracks with graceful fallback for unavailable devices.
   */
  public async getUserMedia(
    requestAudio: boolean,
    requestVideo: boolean,
    settings: DeviceSettings
  ): Promise<MediaStream> {
    // Release existing tracks before getting new ones
    this.stopLocalStream();

    const constraints: MediaStreamConstraints = {};

    if (requestAudio) {
      constraints.audio = {
        deviceId: settings.audioInputId ? { exact: settings.audioInputId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
    } else {
      constraints.audio = false;
    }

    if (requestVideo) {
      constraints.video = this.getVideoConstraints(settings.qualityPreset, settings.videoInputId);
    } else {
      constraints.video = false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err: any) {
      console.error('[MediaManager] getUserMedia failed with constraints:', constraints, err);

      // Handle specific error codes
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera or microphone permission was denied. Please allow device access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        // Fallback: try audio only if video failed
        if (requestVideo && requestAudio) {
          console.warn('[MediaManager] Falling back to audio-only stream...');
          return this.getUserMedia(true, false, settings);
        }
        throw new Error('Requested media device was not found on your system.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Device is currently in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        // Retry with basic unconstrained settings
        console.warn('[MediaManager] Retrying with generic unconstrained media...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: requestAudio,
          video: requestVideo,
        });
        this.localStream = stream;
        return stream;
      }
      throw new Error(err.message || 'Unable to access camera or microphone.');
    }
  }

  /**
   * Toggle microphone track.
   */
  public setMicrophoneEnabled(enabled: boolean): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Toggle camera track.
   */
  public setCameraEnabled(enabled: boolean): void {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Switch audio input device live.
   */
  public async switchAudioInput(deviceId: string): Promise<MediaStreamTrack | null> {
    if (!this.localStream) return null;
    const oldTrack = this.localStream.getAudioTracks()[0];

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getAudioTracks()[0];

      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);
      return newTrack;
    } catch (err: any) {
      console.error('[MediaManager] Failed to switch audio input:', err);
      throw err;
    }
  }

  /**
   * Switch video input device live.
   */
  public async switchVideoInput(
    deviceId: string,
    preset: MediaQualityPreset
  ): Promise<MediaStreamTrack | null> {
    if (!this.localStream) return null;
    const oldTrack = this.localStream.getVideoTracks()[0];

    try {
      const constraints = this.getVideoConstraints(preset, deviceId);
      const newStream = await navigator.mediaDevices.getUserMedia({ video: constraints });
      const newTrack = newStream.getVideoTracks()[0];

      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);
      return newTrack;
    } catch (err: any) {
      console.error('[MediaManager] Failed to switch video input:', err);
      throw err;
    }
  }

  /**
   * Set audio output sink if supported by browser (e.g. Chrome, Edge).
   */
  public async setAudioOutput(element: HTMLMediaElement, deviceId: string): Promise<boolean> {
    if (typeof (element as any).setSinkId === 'function') {
      try {
        await (element as any).setSinkId(deviceId);
        return true;
      } catch (err) {
        console.warn('[MediaManager] setSinkId failed:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Start Web Audio API audio level monitoring for voice activity detection.
   */
  public startAudioLevelMonitoring(
    stream: MediaStream,
    onLevel: (level: number) => void
  ): void {
    this.stopAudioLevelMonitoring();

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);

      this.audioLevelInterval = setInterval(() => {
        if (!this.analyser || !audioTrack.enabled) {
          onLevel(0);
          return;
        }

        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        // Normalize between 0 and 1
        const normalized = Math.min(1, average / 128);
        onLevel(normalized);
      }, 100);
    } catch (err) {
      console.warn('[MediaManager] Audio level monitoring could not be started:', err);
    }
  }

  /**
   * Stop audio level monitoring.
   */
  public stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }
  }

  /**
   * Stop all local stream tracks and clean up resources.
   */
  public stopLocalStream(): void {
    this.stopAudioLevelMonitoring();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.localStream = null;
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}
