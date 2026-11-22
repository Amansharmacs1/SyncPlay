import { io, Socket } from 'socket.io-client';
import { useRoomStore } from '../stores/useRoomStore.js';
import { useToastStore } from '../stores/useToastStore.js';
import { webrtcManager } from './webrtc/WebRTCManager.js';
import { SOCKET_URL } from '../config/env.js';
import { MediaState, PlaybackState, RoomData, Participant, ChatMessage } from '../types/index.js';

class SocketService {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private reconnectAttempts = 0;

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    useRoomStore.getState().setConnectionStatus('connecting');

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    // Initialize WebRTC signaling hooks
    webrtcManager.initializeSignaling(this.socket);

    this.registerSocketListeners(this.socket);
    return this.socket;
  }

  private registerSocketListeners(socket: Socket) {
    socket.on('connect', () => {
      console.log('[Socket] Connected to server with ID:', socket.id);
      this.reconnectAttempts = 0;
      useRoomStore.getState().setConnectionStatus('connected');
      useRoomStore.getState().setErrorMessage(null);

      // If reconnecting to an ongoing room session
      if (this.currentRoomId) {
        const { participantId, displayName } = useRoomStore.getState();
        this.joinRoom(this.currentRoomId, participantId, displayName);
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected from server. Reason:', reason);
      useRoomStore.getState().setConnectionStatus('disconnected');
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.reconnectAttempts++;
      useRoomStore.getState().setConnectionStatus('reconnecting');
      if (this.reconnectAttempts > 5) {
        useRoomStore.getState().setErrorMessage('Unable to connect to SyncPlay real-time server. Retrying...');
      }
    });

    socket.on('room:state', (roomData: RoomData) => {
      console.log('[Socket] Received room state:', roomData);
      useRoomStore.getState().setRoom(roomData);
      useRoomStore.getState().setErrorMessage(null);
    });

    socket.on('room:error', (error: { message: string; code?: string }) => {
      console.error('[Socket] Room error:', error);
      useRoomStore.getState().setErrorMessage(error.message);
      useToastStore.getState().addToast(error.message, 'error');
    });

    socket.on('room:closed', ({ reason }) => {
      useToastStore.getState().addToast(reason || 'Room closed', 'error', 6000);
      useRoomStore.getState().resetRoom();
      window.location.href = '/';
    });

    socket.on('media:updated', (media: MediaState) => {
      console.log('[Socket] Media updated:', media);
      useRoomStore.getState().updateMedia(media);
      useToastStore.getState().addToast(`Now playing: ${media.title}`, 'info');
    });

    socket.on('playback:state', (state: PlaybackState) => {
      useRoomStore.getState().updatePlaybackState(state);
    });

    socket.on('playback:sync', (state: PlaybackState) => {
      useRoomStore.getState().updatePlaybackState(state);
    });

    socket.on('sync:heartbeat', (state: PlaybackState) => {
      // Periodic authoritative heartbeat
      useRoomStore.getState().updatePlaybackState(state);
    });

    socket.on('participants:update', (participants: Participant[]) => {
      useRoomStore.getState().updateParticipants(participants);
    });

    socket.on('chat:message', (message: ChatMessage) => {
      useRoomStore.getState().addMessage(message);
    });

    socket.on('chat:history', (messages: ChatMessage[]) => {
      useRoomStore.getState().setMessages(messages);
    });

    socket.on('chat:reaction-updated', ({ messageId, reactions }) => {
      useRoomStore.getState().updateMessageReaction(messageId, reactions);
    });

    socket.on('queue:update', (queue) => {
      useRoomStore.getState().setQueue(queue);
    });

    socket.on('room:settings-updated', (settings) => {
      useRoomStore.getState().updateRoomSettingsState(settings);
      useToastStore.getState().addToast('Room settings updated', 'info');
    });
  }

  public joinRoom(roomId: string, participantId: string, name: string, password?: string) {
    this.currentRoomId = roomId;
    const socket = this.connect();

    socket.emit('room:join', {
      roomId,
      participantId,
      name,
      password,
    });
  }

  public leaveRoom() {
    if (this.socket) {
      this.socket.emit('room:leave');
      this.currentRoomId = null;
    }
  }

  public changeMedia(media: MediaState) {
    if (!this.socket) return;
    this.socket.emit('media:change', { media });
  }

  public play(currentTime: number) {
    if (!this.socket) return;
    this.socket.emit('playback:play', { currentTime, timestamp: Date.now() });
  }

  public pause(currentTime: number) {
    if (!this.socket) return;
    this.socket.emit('playback:pause', { currentTime, timestamp: Date.now() });
  }

  public seek(currentTime: number) {
    if (!this.socket) return;
    this.socket.emit('playback:seek', { currentTime, timestamp: Date.now() });
  }

  public requestSync() {
    if (!this.socket) return;
    this.socket.emit('playback:request-sync');
  }

  public sendMessage(message: string) {
    if (!this.socket) return;
    this.socket.emit('chat:send', { message });
  }

  public sendChatReaction(messageId: string, emoji: string) {
    if (!this.socket) return;
    this.socket.emit('chat:reaction', { messageId, emoji });
  }

  public addToQueue(media: MediaState) {
    if (!this.socket) return;
    this.socket.emit('queue:add', { media });
  }

  public removeFromQueue(itemId: string) {
    if (!this.socket) return;
    this.socket.emit('queue:remove', { itemId });
  }

  public playQueueItem(itemId: string) {
    if (!this.socket) return;
    this.socket.emit('queue:play', { itemId });
  }

  public reorderQueue(itemIds: string[]) {
    if (!this.socket) return;
    this.socket.emit('queue:reorder', { itemIds });
  }

  public reportPlaybackEnded() {
    if (!this.socket) return;
    this.socket.emit('playback:ended');
  }

  public updateRoomSettings(settings: {
    roomName?: string;
    password?: string;
    removePassword?: boolean;
    isLocked?: boolean;
    allowParticipantControl?: boolean;
    visibility?: 'public' | 'private';
  }) {
    if (!this.socket) return;
    this.socket.emit('room:update-settings', settings);
  }

  public kickParticipant(participantId: string) {
    if (!this.socket) return;
    this.socket.emit('participant:kick', { participantId });
  }

  public endRoom() {
    if (!this.socket) return;
    this.socket.emit('room:end');
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
