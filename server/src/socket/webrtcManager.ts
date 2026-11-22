import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  ParticipantMediaStatus,
  ConnectionQuality,
  WebRtcOfferPayload,
  WebRtcAnswerPayload,
  WebRtcCandidatePayload,
  WebRtcJoinPayload,
} from '../types/index.js';
import { ParticipantManager } from './participantManager.js';
import { ChatHandler } from './chatHandler.js';

export const MAX_CALL_PARTICIPANTS = parseInt(process.env.MAX_CALL_PARTICIPANTS || '8', 10);

export class WebRtcSignalingManager {
  // Map of roomId -> Map of participantId -> ParticipantMediaStatus
  private static callRooms: Map<string, Map<string, ParticipantMediaStatus>> = new Map();

  /**
   * Gets all call participants in a room.
   */
  public static getCallParticipants(roomId: string): Map<string, ParticipantMediaStatus> {
    const norm = roomId.toUpperCase();
    if (!this.callRooms.has(norm)) {
      this.callRooms.set(norm, new Map());
    }
    return this.callRooms.get(norm)!;
  }

  /**
   * Checks if a participant is currently in a call.
   */
  public static isParticipantInCall(roomId: string, participantId: string): boolean {
    const participants = this.getCallParticipants(roomId);
    return participants.has(participantId);
  }

  /**
   * Registers WebRTC signaling handlers on a socket.
   */
  public static registerSocketEvents(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
  ): void {
    // 1. WEBRTC JOIN CALL
    socket.on('webrtc:join', (payload: WebRtcJoinPayload) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) {
        socket.emit('room:error', { message: 'Must be in a room to join the video call.' });
        return;
      }

      const { roomId, participant } = senderInfo;
      const callMap = this.getCallParticipants(roomId);

      if (callMap.size >= MAX_CALL_PARTICIPANTS && !callMap.has(participant.id)) {
        socket.emit('room:error', {
          message: `The video call has reached maximum capacity (${MAX_CALL_PARTICIPANTS} participants).`,
          code: 'CALL_CAPACITY_REACHED',
        });
        return;
      }

      const mediaStatus: ParticipantMediaStatus = {
        cameraEnabled: !!payload.cameraEnabled,
        microphoneEnabled: !!payload.microphoneEnabled,
        screenSharing: false,
        callConnected: true,
        connectionQuality: 'excellent',
      };

      callMap.set(participant.id, mediaStatus);

      // Update participant metadata in ParticipantManager
      this.updateParticipantMediaInfo(roomId, participant.id, mediaStatus);

      // Prepare list of existing participants for the new joiner
      const existingCallParticipants: Array<{
        participantId: string;
        name: string;
        cameraEnabled: boolean;
        microphoneEnabled: boolean;
        screenSharing: boolean;
        connectionQuality?: ConnectionQuality;
      }> = [];

      for (const [pId, status] of callMap.entries()) {
        if (pId !== participant.id) {
          const peer = ParticipantManager.getParticipant(roomId, pId);
          if (peer) {
            existingCallParticipants.push({
              participantId: peer.id,
              name: peer.name,
              cameraEnabled: status.cameraEnabled,
              microphoneEnabled: status.microphoneEnabled,
              screenSharing: status.screenSharing,
              connectionQuality: status.connectionQuality,
            });
          }
        }
      }

      // Send existing call participants to the joining client
      socket.emit('webrtc:call-participants', {
        participants: existingCallParticipants,
      });

      // Broadcast to other call members that a new participant joined
      for (const [pId] of callMap.entries()) {
        if (pId !== participant.id) {
          const peer = ParticipantManager.getParticipant(roomId, pId);
          if (peer) {
            const peerSocket = io.sockets.sockets.get(peer.socketId);
            if (peerSocket) {
              peerSocket.emit('webrtc:participant-joined', {
                participantId: participant.id,
                name: participant.name,
                cameraEnabled: mediaStatus.cameraEnabled,
                microphoneEnabled: mediaStatus.microphoneEnabled,
                screenSharing: mediaStatus.screenSharing,
              });
            }
          }
        }
      }

      // Broadcast full room participants update with call status
      io.to(roomId).emit('participants:update', ParticipantManager.getParticipants(roomId));

      console.log(`[WebRTC] ${participant.name} (${participant.id}) joined call in room ${roomId}. Active in call: ${callMap.size}`);
    });

    // 2. WEBRTC OFFER
    socket.on('webrtc:offer', (payload: WebRtcOfferPayload) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      const { targetParticipantId, offer } = payload;

      if (!this.isParticipantInCall(roomId, participant.id)) return;
      if (!this.isParticipantInCall(roomId, targetParticipantId)) return;

      const target = ParticipantManager.getParticipant(roomId, targetParticipantId);
      if (!target) return;

      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('webrtc:offer', {
          fromParticipantId: participant.id,
          offer,
        });
      }
    });

    // 3. WEBRTC ANSWER
    socket.on('webrtc:answer', (payload: WebRtcAnswerPayload) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      const { targetParticipantId, answer } = payload;

      if (!this.isParticipantInCall(roomId, participant.id)) return;
      if (!this.isParticipantInCall(roomId, targetParticipantId)) return;

      const target = ParticipantManager.getParticipant(roomId, targetParticipantId);
      if (!target) return;

      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('webrtc:answer', {
          fromParticipantId: participant.id,
          answer,
        });
      }
    });

    // 4. WEBRTC ICE CANDIDATE
    socket.on('webrtc:ice-candidate', (payload: WebRtcCandidatePayload) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      const { targetParticipantId, candidate } = payload;

      if (!this.isParticipantInCall(roomId, participant.id)) return;
      if (!this.isParticipantInCall(roomId, targetParticipantId)) return;

      const target = ParticipantManager.getParticipant(roomId, targetParticipantId);
      if (!target) return;

      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('webrtc:ice-candidate', {
          fromParticipantId: participant.id,
          candidate,
        });
      }
    });

    // 5. CAMERA STATUS
    socket.on('media:camera-status', ({ enabled }: { enabled: boolean }) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      const callMap = this.getCallParticipants(roomId);
      const status = callMap.get(participant.id);
      if (status) {
        status.cameraEnabled = !!enabled;
        this.broadcastMediaStatus(io, roomId, participant.id, status);
      }
    });

    // 6. MICROPHONE STATUS
    socket.on('media:microphone-status', ({ enabled }: { enabled: boolean }) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      const callMap = this.getCallParticipants(roomId);
      const status = callMap.get(participant.id);
      if (status) {
        status.microphoneEnabled = !!enabled;
        this.broadcastMediaStatus(io, roomId, participant.id, status);
      }
    });

    // 7. SCREEN SHARE STATUS
    socket.on('media:screen-share-status', ({ sharing }: { sharing: boolean }) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      const callMap = this.getCallParticipants(roomId);
      const status = callMap.get(participant.id);
      if (status) {
        status.screenSharing = !!sharing;
        this.broadcastMediaStatus(io, roomId, participant.id, status);

        const shareNotice = sharing
          ? `${participant.name} started sharing their screen.`
          : `${participant.name} stopped screen sharing.`;
        const sysMsg = ChatHandler.createSystemMessage(roomId, shareNotice);
        io.to(roomId).emit('chat:message', sysMsg);
      }
    });

    // 8. CONNECTION QUALITY
    socket.on('media:connection-quality', ({ quality }: { quality: ConnectionQuality }) => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      const callMap = this.getCallParticipants(roomId);
      const status = callMap.get(participant.id);
      if (status) {
        status.connectionQuality = quality;
        this.broadcastMediaStatus(io, roomId, participant.id, status);
      }
    });

    // 9. WEBRTC LEAVE CALL (Explicit leave from call while remaining in watch room)
    socket.on('webrtc:leave', () => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      this.handleLeaveCall(io, roomId, participant.id);
    });

    // 10. HOST END ROOM FOR EVERYONE
    socket.on('room:end', () => {
      const senderInfo = ParticipantManager.getBySocketId(socket.id);
      if (!senderInfo) return;

      const { roomId, participant } = senderInfo;
      if (!participant.isHost) {
        socket.emit('room:error', { message: 'Only the host can end the room.' });
        return;
      }

      // Close room for everyone
      this.callRooms.delete(roomId);
      io.to(roomId).emit('room:closed', { reason: 'The room was ended by the host.' });
    });
  }

  /**
   * Handles a participant leaving the video call.
   */
  public static handleLeaveCall(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    roomId: string,
    participantId: string
  ): void {
    const norm = roomId.toUpperCase();
    const callMap = this.callRooms.get(norm);
    if (!callMap || !callMap.has(participantId)) return;

    callMap.delete(participantId);

    // Update participant media metadata
    this.updateParticipantMediaInfo(norm, participantId, {
      cameraEnabled: false,
      microphoneEnabled: false,
      screenSharing: false,
      callConnected: false,
    });

    // Notify other call members
    for (const [pId] of callMap.entries()) {
      const peer = ParticipantManager.getParticipant(norm, pId);
      if (peer) {
        const peerSocket = io.sockets.sockets.get(peer.socketId);
        if (peerSocket) {
          peerSocket.emit('webrtc:participant-left', { participantId });
        }
      }
    }

    // Broadcast updated participant roster
    io.to(norm).emit('participants:update', ParticipantManager.getParticipants(norm));

    console.log(`[WebRTC] Participant ${participantId} left call in room ${norm}. Remaining in call: ${callMap.size}`);
  }

  /**
   * Broadcasts media status update to all room participants.
   */
  private static broadcastMediaStatus(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    roomId: string,
    participantId: string,
    status: ParticipantMediaStatus
  ): void {
    this.updateParticipantMediaInfo(roomId, participantId, status);
    io.to(roomId).emit('media:participant-status', {
      participantId,
      cameraEnabled: status.cameraEnabled,
      microphoneEnabled: status.microphoneEnabled,
      screenSharing: status.screenSharing,
      connectionQuality: status.connectionQuality,
    });
    io.to(roomId).emit('participants:update', ParticipantManager.getParticipants(roomId));
  }

  /**
   * Updates participant media info in ParticipantManager in-memory list.
   */
  private static updateParticipantMediaInfo(
    roomId: string,
    participantId: string,
    status: ParticipantMediaStatus
  ): void {
    const participant = ParticipantManager.getParticipant(roomId, participantId);
    if (participant) {
      participant.cameraEnabled = status.cameraEnabled;
      participant.microphoneEnabled = status.microphoneEnabled;
      participant.screenSharing = status.screenSharing;
      participant.callConnected = status.callConnected;
      participant.connectionQuality = status.connectionQuality;
    }
  }

  /**
   * Cleans up room when room is destroyed or participant disconnects completely.
   */
  public static handleParticipantDisconnect(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    roomId: string,
    participantId: string
  ): void {
    this.handleLeaveCall(io, roomId, participantId);
  }
}
