import { create } from 'zustand';
import {
  RoomData,
  Participant,
  MediaState,
  PlaybackState,
  ChatMessage,
  ConnectionStatus,
  QueueItem,
  RoomSettings,
} from '../types/index.js';
import { recentRoomsService } from '../services/recentRooms.js';

// Retrieve or generate a persistent participant session id (strictly anonymous, NOT an account)
function getOrCreateParticipantId(): string {
  let id = localStorage.getItem('syncplay_participant_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('syncplay_participant_id', id);
  }
  return id;
}

interface RoomStoreState {
  // Session (Anonymous)
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
  isHost: boolean;
  queue: QueueItem[];
  isLocked: boolean;
  allowParticipantControl: boolean;
  setRoom: (room: RoomData) => void;
  updateParticipants: (participants: Participant[]) => void;
  updateMedia: (media: MediaState) => void;
  updatePlaybackState: (state: PlaybackState) => void;
  setQueue: (queue: QueueItem[]) => void;
  updateRoomSettingsState: (settings: RoomSettings) => void;

  // Chat
  messages: ChatMessage[];
  unreadMessageCount: number;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  updateMessageReaction: (messageId: string, reactions: Record<string, string[]>) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;

  // Local Player synchronization helpers
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
  queue: [],
  isLocked: false,
  allowParticipantControl: false,

  setRoom: (room) => {
    const isHost = room.hostId === get().participantId;
    set({
      room,
      isHost,
      queue: room.queue || [],
      isLocked: !!room.isLocked,
      allowParticipantControl: !!room.allowParticipantControl,
    });

    // Save to local recent rooms without storing account or credentials
    recentRoomsService.saveRecentRoom({
      roomId: room.roomId,
      roomName: room.roomName,
      isHost,
    });
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

  setQueue: (queue) => {
    const { room } = get();
    set({
      queue,
      room: room ? { ...room, queue } : null,
    });
  },

  updateRoomSettingsState: (settings) => {
    const { room } = get();
    if (!room) return;
    set({
      room: {
        ...room,
        roomName: settings.roomName,
        hasPassword: settings.hasPassword,
        isLocked: settings.isLocked,
        allowParticipantControl: settings.allowParticipantControl,
        visibility: settings.visibility,
      },
      isLocked: settings.isLocked,
      allowParticipantControl: settings.allowParticipantControl,
    });

    // Update in recent rooms
    recentRoomsService.saveRecentRoom({
      roomId: room.roomId,
      roomName: settings.roomName,
      isHost: get().isHost,
    });
  },

  messages: [],
  unreadMessageCount: 0,
  addMessage: (msg) =>
    set((state) => {
      if (state.messages.some((m) => m.id === msg.id)) {
        return state;
      }
      return { messages: [...state.messages, msg] };
    }),
  setMessages: (messages) => set({ messages }),

  updateMessageReaction: (messageId, reactions) =>
    set((state) => {
      const updatedMessages = state.messages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      );
      return { messages: updatedMessages };
    }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadMessageCount: state.unreadMessageCount + 1 })),
  resetUnreadCount: () => set({ unreadMessageCount: 0 }),

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
      queue: [],
      messages: [],
      unreadMessageCount: 0,
      connectionStatus: 'disconnected',
      errorMessage: null,
      localCurrentTime: 0,
      localDuration: 0,
    }),
}));
