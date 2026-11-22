import { Participant } from '../types/index.js';

interface DisconnectTimer {
  timer: NodeJS.Timeout;
  participantId: string;
  roomId: string;
}

export class ParticipantManager {
  // Map of roomId -> Array of active Participants
  private static rooms: Map<string, Participant[]> = new Map();
  // Map of socketId -> { roomId, participantId }
  private static socketMap: Map<string, { roomId: string; participantId: string }> = new Map();
  // Map of participantId -> DisconnectTimer
  private static disconnectTimers: Map<string, DisconnectTimer> = new Map();

  /**
   * Adds or updates a participant in a room.
   * Prevents duplicates if the user is reconnecting or refreshing.
   */
  public static addParticipant(
    roomId: string,
    participant: {
      id: string;
      socketId: string;
      name: string;
      isHost: boolean;
      avatarSeed?: string;
    }
  ): Participant[] {
    const normRoomId = roomId.toUpperCase();
    let list = this.rooms.get(normRoomId) || [];

    // Cancel any pending disconnect timer for this participant
    const pendingTimer = this.disconnectTimers.get(participant.id);
    if (pendingTimer) {
      clearTimeout(pendingTimer.timer);
      this.disconnectTimers.delete(participant.id);
    }

    // Check if participant already exists in the room
    const existingIndex = list.findIndex((p) => p.id === participant.id);

    if (existingIndex >= 0) {
      // Update their socketId and keep their existing host status and joinedAt
      list[existingIndex] = {
        ...list[existingIndex],
        socketId: participant.socketId,
        name: participant.name, // update name if changed
      };
    } else {
      const newParticipant: Participant = {
        id: participant.id,
        socketId: participant.socketId,
        name: participant.name,
        isHost: participant.isHost,
        joinedAt: Date.now(),
        avatarSeed: participant.avatarSeed || participant.name,
      };
      list.push(newParticipant);
    }

    this.rooms.set(normRoomId, list);
    this.socketMap.set(participant.socketId, { roomId: normRoomId, participantId: participant.id });
    return list;
  }

  /**
   * Gets participants of a room.
   */
  public static getParticipants(roomId: string): Participant[] {
    return this.rooms.get(roomId.toUpperCase()) || [];
  }

  /**
   * Finds participant by ID in a room.
   */
  public static getParticipant(roomId: string, participantId: string): Participant | undefined {
    const list = this.rooms.get(roomId.toUpperCase()) || [];
    return list.find((p) => p.id === participantId);
  }

  /**
   * Finds participant by socket ID.
   */
  public static getBySocketId(socketId: string): { roomId: string; participant: Participant } | null {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return null;

    const list = this.rooms.get(mapping.roomId) || [];
    const participant = list.find((p) => p.id === mapping.participantId);
    if (!participant) return null;

    return { roomId: mapping.roomId, participant };
  }

  /**
   * Handles disconnect with a brief grace period to prevent flickering during reload.
   */
  public static handleDisconnect(
    socketId: string,
    onRemove: (roomId: string, removedParticipant: Participant, updatedList: Participant[]) => void
  ): void {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return;

    this.socketMap.delete(socketId);
    const { roomId, participantId } = mapping;
    const list = this.rooms.get(roomId) || [];
    const participant = list.find((p) => p.id === participantId);

    if (!participant) return;

    // Set grace period of 4 seconds for page reload / temporary blips
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(participantId);
      const currentList = this.rooms.get(roomId) || [];
      const updatedList = currentList.filter((p) => p.id !== participantId);
      this.rooms.set(roomId, updatedList);

      // Trigger removal callback
      onRemove(roomId, participant, updatedList);

      // Clean up empty room map after 1 hour if idle
      if (updatedList.length === 0) {
        setTimeout(() => {
          if ((this.rooms.get(roomId) || []).length === 0) {
            this.rooms.delete(roomId);
          }
        }, 3600000);
      }
    }, 4000);

    this.disconnectTimers.set(participantId, { timer, participantId, roomId });
  }

  /**
   * Forcibly removes a participant (e.g. host kick or explicit leave).
   */
  public static removeParticipant(roomId: string, participantId: string): Participant[] {
    const normRoomId = roomId.toUpperCase();
    const currentList = this.rooms.get(normRoomId) || [];
    const updatedList = currentList.filter((p) => p.id !== participantId);
    this.rooms.set(normRoomId, updatedList);

    const pendingTimer = this.disconnectTimers.get(participantId);
    if (pendingTimer) {
      clearTimeout(pendingTimer.timer);
      this.disconnectTimers.delete(participantId);
    }

    return updatedList;
  }
}
