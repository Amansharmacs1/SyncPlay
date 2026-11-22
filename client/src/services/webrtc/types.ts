export type MediaQualityPreset = 'low' | 'balanced' | 'high';

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'reconnecting';

export type CallJoinOption = 'camera-and-mic' | 'mic-only' | 'no-media';

export interface DeviceSettings {
  audioInputId?: string;
  videoInputId?: string;
  audioOutputId?: string;
  qualityPreset: MediaQualityPreset;
}

export interface MediaDeviceInfoList {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
}

export interface ParticipantCallState {
  participantId: string;
  name: string;
  stream: MediaStream | null;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  connectionQuality: ConnectionQuality;
  audioLevel: number; // 0 to 1
  isLocal: boolean;
}

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}
