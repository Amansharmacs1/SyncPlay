export class ScreenShareManager {
  private screenStream: MediaStream | null = null;
  private onEndedCallback: (() => void) | null = null;

  /**
   * Check whether screen sharing is supported in the current environment.
   */
  public isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function'
    );
  }

  /**
   * Start screen sharing capture with system audio if available.
   */
  public async startScreenShare(onEnded: () => void): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Screen sharing is not supported by your browser or device (e.g. mobile Safari/Chrome).');
    }

    this.onEndedCallback = onEnded;

    try {
      const displayConstraints: any = {
        video: {
          cursor: 'always',
          frameRate: { max: 30 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);

      this.screenStream = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // Handle user stopping share through native browser banner
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Screen sharing permission was cancelled or denied.');
      }
      throw new Error(err.message || 'Failed to start screen sharing.');
    }
  }

  /**
   * Stop active screen sharing.
   */
  public stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.screenStream = null;
    }

    if (this.onEndedCallback) {
      const cb = this.onEndedCallback;
      this.onEndedCallback = null;
      cb();
    }
  }

  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  public isSharing(): boolean {
    return !!this.screenStream && this.screenStream.getVideoTracks().some((t) => t.readyState === 'live');
  }
}
