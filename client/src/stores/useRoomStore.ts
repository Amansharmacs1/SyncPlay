import { create } from 'zustand';
import { RoomData, Participant, MediaState, PlaybackState, ChatMessage, ConnectionStatus } from '../types/index.js';

// Retrieve or generate a persistent participant session id
function getOrCreateParticipantId(): string {
  let id = localStorage.getItem('syncplay_participant_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('syncplay_participant_id', id);
  }
  return id;
}

interface RoomStoreState {
  // Session
  participantId: string;
  displayName: string;
  setDisplayName: (name: string) => void;

  // Connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;

  // Room
  room: RoomData | null;
  setRoom: (room: RoomData) => void;
  updateParticipants: (participants: Participant[]) => void;
  updateMedia: (media: MediaState) => void;
  updatePlaybackState: (state: PlaybackState) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;

  // Local Player synchronization helpers
  isHost: boolean;
  localCurrentTime: number;
  setLocalCurrentTime: (time: number) => void;
  localDuration: number;
  setLocalDuration: (duration: number) => void;
  isSeeking: boolean;
  setIsSeeking: (isSeeking: boolean) => void;

  // Reset
  resetRoom: () => void;
}

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  participantId: getOrCreateParticipantId(),
  displayName: localStorage.getItem('syncplay_display_name') || '',
  setDisplayName: (name: string) => {
    localStorage.setItem('syncplay_display_name', name);
    set({ displayName: name });
  },

  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  errorMessage: null,
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  room: null,
  isHost: false,
  setRoom: (room) => {
    const isHost = room.hostId === get().participantId;
    set({ room, isHost });
  },

  updateParticipants: (participants) => {
    const { room, participantId } = get();
    if (!room) return;
    const isHost = room.hostId === participantId;
    set({
      room: { ...room, participants },
      isHost,
    });
  },

  updateMedia: (media) => {
    const { room } = get();
    if (!room) return;
    set({
      room: {
        ...room,
        media,
        playbackState: {
          ...room.playbackState,
          status: 'paused',
          currentTime: 0,
          lastUpdated: Date.now(),
        },
      },
      localCurrentTime: 0,
    });
  },

  updatePlaybackState: (playbackState) => {
    const { room } = get();
    if (!room) return;
    set({
      room: { ...room, playbackState },
    });
  },

  messages: [],
  addMessage: (msg) =>
    set((state) => {
      // Prevent duplicate messages if re-received
      if (state.messages.some((m) => m.id === msg.id)) {
        return state;
      }
      return { messages: [...state.messages, msg] };
    }),
  setMessages: (messages) => set({ messages }),

  localCurrentTime: 0,
  setLocalCurrentTime: (time) => set({ localCurrentTime: time }),
  localDuration: 0,
  setLocalDuration: (localDuration) => set({ localDuration }),
  isSeeking: false,
  setIsSeeking: (isSeeking) => set({ isSeeking }),

  resetRoom: () =>
    set({
      room: null,
      isHost: false,
      messages: [],
      connectionStatus: 'disconnected',
      errorMessage: null,
      localCurrentTime: 0,
      localDuration: 0,
    }),
}));
