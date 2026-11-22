import { create } from 'zustand';
import {
  MediaQualityPreset,
  ConnectionQuality,
  MediaDeviceInfoList,
  ParticipantCallState,
} from '../services/webrtc/types.js';

interface CallStoreState {
  isInCall: boolean;
  isJoining: boolean;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  isScreenSharing: boolean;
  activeSpeakerId: string | null;

  // View Layout
  callLayout: 'grid' | 'focus' | 'sidebar';
  focusedParticipantId: string | null;
  activeStageView: 'media' | 'screenshare';
  sharingLayout: 'side-by-side' | 'filmstrip' | 'grid';

  // Media Quality & Devices
  qualityPreset: MediaQualityPreset;
  availableDevices: MediaDeviceInfoList;
  selectedAudioInput: string;
  selectedVideoInput: string;
  selectedAudioOutput: string;

  // Remote Call Participants (Keyed by participantId)
  callParticipants: Map<string, ParticipantCallState>;

  // UI Modals
  preJoinModalOpen: boolean;
  deviceSettingsModalOpen: boolean;

  // Actions
  setInCall: (inCall: boolean) => void;
  setIsJoining: (joining: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setCameraEnabled: (enabled: boolean) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
  setIsScreenSharing: (sharing: boolean) => void;
  setActiveSpeakerId: (id: string | null) => void;
  setCallLayout: (layout: 'grid' | 'focus' | 'sidebar') => void;
  setFocusedParticipantId: (id: string | null) => void;
  setActiveStageView: (view: 'media' | 'screenshare') => void;
  setSharingLayout: (layout: 'side-by-side' | 'filmstrip' | 'grid') => void;
  setQualityPreset: (preset: MediaQualityPreset) => void;
  setAvailableDevices: (devices: MediaDeviceInfoList) => void;
  setSelectedAudioInput: (id: string) => void;
  setSelectedVideoInput: (id: string) => void;
  setSelectedAudioOutput: (id: string) => void;
  setPreJoinModalOpen: (open: boolean) => void;
  setDeviceSettingsModalOpen: (open: boolean) => void;

  // Participant updates
  upsertCallParticipant: (participantId: string, data: Partial<ParticipantCallState>) => void;
  removeCallParticipant: (participantId: string) => void;
  updateParticipantAudioLevel: (participantId: string, level: number) => void;
  resetCall: () => void;
}

export const useCallStore = create<CallStoreState>((set) => ({
  isInCall: false,
  isJoining: false,
  localStream: null,
  screenStream: null,
  cameraEnabled: true,
  microphoneEnabled: true,
  isScreenSharing: false,
  activeSpeakerId: null,

  callLayout: 'sidebar',
  focusedParticipantId: null,
  activeStageView: 'media',
  sharingLayout: 'side-by-side',

  qualityPreset: 'balanced',
  availableDevices: { audioInputs: [], videoInputs: [], audioOutputs: [] },
  selectedAudioInput: '',
  selectedVideoInput: '',
  selectedAudioOutput: '',

  callParticipants: new Map(),

  preJoinModalOpen: false,
  deviceSettingsModalOpen: false,

  setInCall: (isInCall) => set({ isInCall }),
  setIsJoining: (isJoining) => set({ isJoining }),
  setLocalStream: (localStream) => set({ localStream }),
  setScreenStream: (screenStream) => set({ screenStream }),
  setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
  setMicrophoneEnabled: (microphoneEnabled) => set({ microphoneEnabled }),
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setActiveSpeakerId: (activeSpeakerId) => set({ activeSpeakerId }),
  setCallLayout: (callLayout) => set({ callLayout }),
  setFocusedParticipantId: (focusedParticipantId) => set({ focusedParticipantId }),
  setActiveStageView: (activeStageView) => set({ activeStageView }),
  setSharingLayout: (sharingLayout) => set({ sharingLayout }),
  setQualityPreset: (qualityPreset) => set({ qualityPreset }),
  setAvailableDevices: (availableDevices) => set({ availableDevices }),
  setSelectedAudioInput: (selectedAudioInput) => set({ selectedAudioInput }),
  setSelectedVideoInput: (selectedVideoInput) => set({ selectedVideoInput }),
  setSelectedAudioOutput: (selectedAudioOutput) => set({ selectedAudioOutput }),
  setPreJoinModalOpen: (preJoinModalOpen) => set({ preJoinModalOpen }),
  setDeviceSettingsModalOpen: (deviceSettingsModalOpen) => set({ deviceSettingsModalOpen }),

  upsertCallParticipant: (participantId, data) =>
    set((state) => {
      const nextMap = new Map(state.callParticipants);
      const existing = nextMap.get(participantId);

      const updated: ParticipantCallState = {
        participantId,
        name: data.name ?? existing?.name ?? 'Guest',
        stream: data.stream !== undefined ? data.stream : existing?.stream ?? null,
        cameraEnabled: data.cameraEnabled ?? existing?.cameraEnabled ?? true,
        microphoneEnabled: data.microphoneEnabled ?? existing?.microphoneEnabled ?? true,
        screenSharing: data.screenSharing ?? existing?.screenSharing ?? false,
        connectionQuality: data.connectionQuality ?? existing?.connectionQuality ?? 'excellent',
        audioLevel: data.audioLevel ?? existing?.audioLevel ?? 0,
        isLocal: false,
      };

      nextMap.set(participantId, updated);
      return { callParticipants: nextMap };
    }),

  removeCallParticipant: (participantId) =>
    set((state) => {
      const nextMap = new Map(state.callParticipants);
      nextMap.delete(participantId);
      return {
        callParticipants: nextMap,
        focusedParticipantId:
          state.focusedParticipantId === participantId ? null : state.focusedParticipantId,
      };
    }),

  updateParticipantAudioLevel: (participantId, level) =>
    set((state) => {
      const participant = state.callParticipants.get(participantId);
      if (!participant) return state;

      const nextMap = new Map(state.callParticipants);
      nextMap.set(participantId, { ...participant, audioLevel: level });

      // Determine active speaker
      let loudestId: string | null = state.activeSpeakerId;
      if (level > 0.15) {
        loudestId = participantId;
      }

      return {
        callParticipants: nextMap,
        activeSpeakerId: loudestId,
      };
    }),

  resetCall: () =>
    set({
      isInCall: false,
      isJoining: false,
      localStream: null,
      screenStream: null,
      cameraEnabled: true,
      microphoneEnabled: true,
      isScreenSharing: false,
      activeSpeakerId: null,
      callParticipants: new Map(),
      focusedParticipantId: null,
    }),
}));
