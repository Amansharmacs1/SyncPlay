import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, RoomData } from '../types/index.js';
import { RoomService } from '../services/roomService.js';
import { SyncEngine } from './syncEngine.js';
import { ParticipantManager } from './participantManager.js';
import { ChatHandler } from './chatHandler.js';
import { WebRtcSignalingManager } from './webrtcManager.js';

export function setupSocketIO(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  // Start periodic heartbeat broadcast for playback drift correction (runs every 3.5s)
  setInterval(async () => {
    // For every active room in participantManager
    const rooms = io.sockets.adapter.rooms;
    for (const [roomCode] of rooms) {
      // Room codes in socket.io include socket IDs too, so ensure it looks like a room ID
      if (roomCode.length <= 10 && !roomCode.startsWith('user_')) {
        const state = await SyncEngine.getAuthoritativeState(roomCode);
        io.to(roomCode).emit('sync:heartbeat', state);
      }
    }
  }, 3500);

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Register WebRTC Signaling Handlers (Phase 2)
    WebRtcSignalingManager.registerSocketEvents(io, socket);

    // JOIN ROOM
    socket.on('room:join', async ({ roomId, participantId, name, password }) => {
      const normRoomId = roomId.toUpperCase();
      try {
        const room = await RoomService.getRoom(normRoomId);
        if (!room) {
          socket.emit('room:error', { message: 'Room not found or has expired.', code: 'ROOM_NOT_FOUND' });
          return;
        }

        // Check password if configured
        if (room.passwordHash) {
          const isPasswordValid = await RoomService.verifyPassword(normRoomId, password);
          if (!isPasswordValid) {
            socket.emit('room:error', { message: 'Incorrect room password.', code: 'INVALID_PASSWORD' });
            return;
          }
        }

        // Check if user is the designated host
        const isHost = room.hostId === participantId;

        // Add to participant manager
        const updatedParticipants = ParticipantManager.addParticipant(normRoomId, {
          id: participantId,
          socketId: socket.id,
          name: name.trim() || 'Anonymous',
          isHost,
        });

        // Join socket.io channel
        socket.join(normRoomId);

        // Fetch authoritative playback state and media
        const playbackState = await SyncEngine.getAuthoritativeState(normRoomId);
        const chatHistory = await ChatHandler.getHistory(normRoomId);

        const roomData: RoomData = {
          roomId: room.roomId,
          roomName: room.roomName,
          hostId: room.hostId,
          hasPassword: !!room.passwordHash,
          visibility: room.visibility,
          media: room.media,
          playbackState,
          participants: updatedParticipants,
          createdAt: room.createdAt.getTime(),
        };

        // Send full room state to the joining client
        socket.emit('room:state', roomData);
        socket.emit('chat:history', chatHistory);

        // Broadcast updated participants list to everyone in the room
        io.to(normRoomId).emit('participants:update', updatedParticipants);

        // System message on join
        const joinMsg = ChatHandler.createSystemMessage(normRoomId, `${name} joined the room.`);
        io.to(normRoomId).emit('chat:message', joinMsg);

        console.log(`[Socket] ${name} (${participantId}) joined room ${normRoomId}. IsHost: ${isHost}`);
      } catch (err: any) {
        console.error(`[Socket] Error joining room ${normRoomId}:`, err);
        socket.emit('room:error', { message: 'Failed to join room: ' + err.message });
      }
    });

    // MEDIA CHANGE (HOST ONLY)
    socket.on('media:change', async ({ media }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      if (!participant.isHost) {
        socket.emit('room:error', { message: 'Only the room host can change the media.' });
        return;
      }

      try {
        await RoomService.updateMedia(roomId, media);
        const newPlayback = await SyncEngine.resetMediaState(roomId, media.duration);

        io.to(roomId).emit('media:updated', media);
        io.to(roomId).emit('playback:state', newPlayback);

        const changeMsg = ChatHandler.createSystemMessage(roomId, `${participant.name} loaded new video: ${media.title}`);
        io.to(roomId).emit('chat:message', changeMsg);
      } catch (err: any) {
        console.error(`[Socket] Error updating media:`, err);
        socket.emit('room:error', { message: 'Failed to change media.' });
      }
    });

    // PLAYBACK PLAY (HOST ONLY)
    socket.on('playback:play', async ({ currentTime }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      if (!participant.isHost) {
        // Disallow non-host playback controls
        const authState = await SyncEngine.getAuthoritativeState(roomId);
        socket.emit('playback:sync', authState);
        return;
      }

      const newState = await SyncEngine.handlePlay(roomId, currentTime);
      io.to(roomId).emit('playback:state', newState);
    });

    // PLAYBACK PAUSE (HOST ONLY)
    socket.on('playback:pause', async ({ currentTime }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      if (!participant.isHost) {
        const authState = await SyncEngine.getAuthoritativeState(roomId);
        socket.emit('playback:sync', authState);
        return;
      }

      const newState = await SyncEngine.handlePause(roomId, currentTime);
      io.to(roomId).emit('playback:state', newState);
    });

    // PLAYBACK SEEK (HOST ONLY)
    socket.on('playback:seek', async ({ currentTime }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      if (!participant.isHost) {
        const authState = await SyncEngine.getAuthoritativeState(roomId);
        socket.emit('playback:sync', authState);
        return;
      }

      const newState = await SyncEngine.handleSeek(roomId, currentTime);
      io.to(roomId).emit('playback:sync', newState);
    });

    // REQUEST SYNC (e.g. late joiner or player buffer recovery)
    socket.on('playback:request-sync', async () => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId } = participantInfo;
      const authState = await SyncEngine.getAuthoritativeState(roomId);
      socket.emit('playback:sync', authState);
    });

    // CHAT SEND
    socket.on('chat:send', async ({ message }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      try {
        const chatMsg = await ChatHandler.createMessage({
          roomId,
          senderId: participant.id,
          senderName: participant.name,
          message,
        });

        if (chatMsg) {
          io.to(roomId).emit('chat:message', chatMsg);
        }
      } catch (err: any) {
        socket.emit('room:error', { message: err.message });
      }
    });

    // PARTICIPANT KICK (HOST ONLY)
    socket.on('participant:kick', async ({ participantId }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo || !participantInfo.participant.isHost) return;

      const { roomId } = participantInfo;
      const target = ParticipantManager.getParticipant(roomId, participantId);
      if (!target || target.isHost) return;

      const updated = ParticipantManager.removeParticipant(roomId, participantId);
      io.to(roomId).emit('participants:update', updated);

      // Disconnect target socket if found
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('room:closed', { reason: 'You were removed from the room by the host.' });
        targetSocket.leave(roomId);
      }

      const kickMsg = ChatHandler.createSystemMessage(roomId, `${target.name} was removed by the host.`);
      io.to(roomId).emit('chat:message', kickMsg);
    });

    // EXPLICIT ROOM LEAVE
    socket.on('room:leave', () => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      WebRtcSignalingManager.handleLeaveCall(io, roomId, participant.id);
      socket.leave(roomId);
      const updated = ParticipantManager.removeParticipant(roomId, participant.id);
      io.to(roomId).emit('participants:update', updated);

      const leaveMsg = ChatHandler.createSystemMessage(roomId, `${participant.name} left the room.`);
      io.to(roomId).emit('chat:message', leaveMsg);
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      ParticipantManager.handleDisconnect(socket.id, (roomId, removedParticipant, updatedList) => {
        WebRtcSignalingManager.handleParticipantDisconnect(io, roomId, removedParticipant.id);
        io.to(roomId).emit('participants:update', updatedList);
        const leaveMsg = ChatHandler.createSystemMessage(roomId, `${removedParticipant.name} left the room.`);
        io.to(roomId).emit('chat:message', leaveMsg);
      });
    });
  });
}
