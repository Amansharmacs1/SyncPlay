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
    },
    isSocketActive?: (socketId: string) => boolean
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

    let finalId = participant.id;
    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const isExistingActive =
        existing.socketId !== participant.socketId &&
        Boolean(isSocketActive && isSocketActive(existing.socketId));

      if (isExistingActive) {
        // Both sockets are actively connected at the same time (e.g. 2 tabs testing).
        // Assign a distinct unique session ID so both participants remain visible in the room.
        finalId = `${participant.id}_${participant.socketId.slice(0, 5)}`;
        const newParticipant: Participant = {
          id: finalId,
          socketId: participant.socketId,
          name: participant.name,
          isHost: false, // only original tab retains host privileges
          joinedAt: Date.now(),
          avatarSeed: participant.avatarSeed || participant.name,
        };
        list.push(newParticipant);
      } else {
        // Legitimate reconnection of the same participant (page reload or network blip)
        list[existingIndex] = {
          ...list[existingIndex],
          socketId: participant.socketId,
          name: participant.name,
        };
      }
    } else {
      const newParticipant: Participant = {
        id: finalId,
        socketId: participant.socketId,
        name: participant.name,
        isHost: participant.isHost,
        joinedAt: Date.now(),
        avatarSeed: participant.avatarSeed || participant.name,
      };
      list.push(newParticipant);
    }

    this.rooms.set(normRoomId, list);
    this.socketMap.set(participant.socketId, { roomId: normRoomId, participantId: finalId });
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
  public static removeParticipant(
    roomId: string,
    participantId: string
  ): { updatedList: Participant[]; newHostId?: string } {
    const normRoomId = roomId.toUpperCase();
    const currentList = this.rooms.get(normRoomId) || [];
    const removedParticipant = currentList.find((p) => p.id === participantId);
    const updatedList = currentList.filter((p) => p.id !== participantId);

    let newHostId: string | undefined;
    if (removedParticipant?.isHost && updatedList.length > 0) {
      updatedList[0].isHost = true;
      newHostId = updatedList[0].id;
    }

    this.rooms.set(normRoomId, updatedList);

    const pendingTimer = this.disconnectTimers.get(participantId);
    if (pendingTimer) {
      clearTimeout(pendingTimer.timer);
      this.disconnectTimers.delete(participantId);
    }

    return { updatedList, newHostId };
  }

  /**
   * Clears all pending disconnect timers (useful for test teardown).
   */
  public static clearAllTimers(): void {
    for (const entry of this.disconnectTimers.values()) {
      clearTimeout(entry.timer);
    }
    this.disconnectTimers.clear();
    this.rooms.clear();
    this.socketMap.clear();
  }
}
