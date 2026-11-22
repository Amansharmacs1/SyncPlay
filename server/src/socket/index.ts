import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomData,
  MediaState,
  QueueItem,
} from '../types/index.js';
import { RoomService } from '../services/roomService.js';
import { SyncEngine } from './syncEngine.js';
import { ParticipantManager } from './participantManager.js';
import { ChatHandler } from './chatHandler.js';
import { WebRtcSignalingManager } from './webrtcManager.js';

export function setupSocketIO(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  // Start periodic heartbeat broadcast for playback drift correction (runs every 3.5s)
  setInterval(async () => {
    const rooms = io.sockets.adapter.rooms;
    for (const [roomCode] of rooms) {
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

        // Check if user is the designated host
        const isHost = room.hostId === participantId;

        // Check if room is locked by host (prevents new participants, permits reconnecting existing participants)
        if (room.isLocked && !isHost) {
          const existing = ParticipantManager.getParticipant(normRoomId, participantId);
          if (!existing) {
            socket.emit('room:error', {
              message: 'This room is currently locked by the host.',
              code: 'ROOM_LOCKED',
            });
            return;
          }
        }

        // Check password if configured
        if (room.passwordHash) {
          const isPasswordValid = await RoomService.verifyPassword(normRoomId, password);
          if (!isPasswordValid) {
            socket.emit('room:error', { message: 'Incorrect room password.', code: 'INVALID_PASSWORD' });
            return;
          }
        }

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
          isLocked: !!room.isLocked,
          allowParticipantControl: !!room.allowParticipantControl,
          visibility: room.visibility,
          media: room.media,
          playbackState,
          queue: room.queue || [],
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

    // MEDIA CHANGE
    socket.on('media:change', async ({ media }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const room = await RoomService.getRoom(roomId);
      const canControl = participant.isHost || (room && room.allowParticipantControl);

      if (!canControl) {
        socket.emit('room:error', { message: 'Only the room host can change the media.' });
        return;
      }

      try {
        await RoomService.updateMedia(roomId, media);
        const newPlayback = await SyncEngine.resetMediaState(roomId, media.duration);

        io.to(roomId).emit('media:updated', media);
        io.to(roomId).emit('playback:state', newPlayback);

        const changeMsg = ChatHandler.createSystemMessage(roomId, `${participant.name} loaded: ${media.title}`);
        io.to(roomId).emit('chat:message', changeMsg);
      } catch (err: any) {
        console.error(`[Socket] Error updating media:`, err);
        socket.emit('room:error', { message: 'Failed to change media.' });
      }
    });

    // PLAYBACK PLAY
    socket.on('playback:play', async ({ currentTime }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const room = await RoomService.getRoom(roomId);
      const canControl = participant.isHost || (room && room.allowParticipantControl);

      if (!canControl) {
        const authState = await SyncEngine.getAuthoritativeState(roomId);
        socket.emit('playback:sync', authState);
        return;
      }

      const newState = await SyncEngine.handlePlay(roomId, currentTime);
      io.to(roomId).emit('playback:state', newState);
    });

    // PLAYBACK PAUSE
    socket.on('playback:pause', async ({ currentTime }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const room = await RoomService.getRoom(roomId);
      const canControl = participant.isHost || (room && room.allowParticipantControl);

      if (!canControl) {
        const authState = await SyncEngine.getAuthoritativeState(roomId);
        socket.emit('playback:sync', authState);
        return;
      }

      const newState = await SyncEngine.handlePause(roomId, currentTime);
      io.to(roomId).emit('playback:state', newState);
    });

    // PLAYBACK SEEK
    socket.on('playback:seek', async ({ currentTime }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const room = await RoomService.getRoom(roomId);
      const canControl = participant.isHost || (room && room.allowParticipantControl);

      if (!canControl) {
        const authState = await SyncEngine.getAuthoritativeState(roomId);
        socket.emit('playback:sync', authState);
        return;
      }

      const newState = await SyncEngine.handleSeek(roomId, currentTime);
      io.to(roomId).emit('playback:sync', newState);
    });

    // PLAYBACK ENDED -> Auto-advance queue
    socket.on('playback:ended', async () => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      if (!participant.isHost) return; // Only host triggers auto-advance to prevent duplicate pops

      try {
        const { nextMedia, queue } = await RoomService.popNextFromQueue(roomId);
        if (nextMedia) {
          const newPlayback = await SyncEngine.resetMediaState(roomId, nextMedia.duration);
          io.to(roomId).emit('media:updated', nextMedia);
          io.to(roomId).emit('playback:state', newPlayback);
          io.to(roomId).emit('queue:update', queue);

          const advMsg = ChatHandler.createSystemMessage(roomId, `Now playing next in queue: ${nextMedia.title}`);
          io.to(roomId).emit('chat:message', advMsg);
        }
      } catch (err) {
        console.warn(`[Socket] Error advancing queue for room ${roomId}:`, err);
      }
    });

    // REQUEST SYNC
    socket.on('playback:request-sync', async () => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId } = participantInfo;
      const authState = await SyncEngine.getAuthoritativeState(roomId);
      socket.emit('playback:sync', authState);
    });

    // QUEUE: ADD ITEM
    socket.on('queue:add', async (payload: any) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const media = payload.media || payload;
      if (!media || !media.url) return;

      const { roomId, participant } = participantInfo;
      const newItem: QueueItem = {
        id: 'q_' + Math.random().toString(36).substring(2, 10),
        type: media.type || 'youtube',
        url: media.url,
        title: media.title || 'Queued Video',
        duration: media.duration || 0,
        addedBy: participant.name,
        addedById: participant.id,
        addedAt: Date.now(),
      };

      const updatedQueue = await RoomService.addToQueue(roomId, newItem);
      io.to(roomId).emit('queue:update', updatedQueue);

      const qMsg = ChatHandler.createSystemMessage(roomId, `${participant.name} added to queue: ${newItem.title}`);
      io.to(roomId).emit('chat:message', qMsg);
    });

    // QUEUE: REMOVE ITEM
    socket.on('queue:remove', async ({ itemId }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const room = await RoomService.getRoom(roomId);
      if (!room) return;

      const targetItem = room.queue.find((q) => q.id === itemId);
      if (!targetItem) return;

      if (!participant.isHost && targetItem.addedById !== participant.id) {
        socket.emit('room:error', { message: 'You can only remove videos you added to the queue.' });
        return;
      }

      const updatedQueue = await RoomService.removeFromQueue(roomId, itemId);
      io.to(roomId).emit('queue:update', updatedQueue);
    });

    // QUEUE: PLAY SPECIFIC ITEM NOW
    socket.on('queue:play', async ({ itemId }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const room = await RoomService.getRoom(roomId);
      if (!room) return;

      const canControl = participant.isHost || room.allowParticipantControl;
      if (!canControl) {
        socket.emit('room:error', { message: 'Only the host can start queue playback.' });
        return;
      }

      const targetItem = room.queue.find((q) => q.id === itemId);
      if (!targetItem) return;

      const newMedia: MediaState = {
        type: targetItem.type,
        url: targetItem.url,
        title: targetItem.title,
        duration: targetItem.duration || 0,
      };

      await RoomService.updateMedia(roomId, newMedia);
      const updatedQueue = await RoomService.removeFromQueue(roomId, itemId);
      const newPlayback = await SyncEngine.resetMediaState(roomId, newMedia.duration);

      io.to(roomId).emit('media:updated', newMedia);
      io.to(roomId).emit('playback:state', newPlayback);
      io.to(roomId).emit('queue:update', updatedQueue);

      const playMsg = ChatHandler.createSystemMessage(roomId, `${participant.name} played from queue: ${newMedia.title}`);
      io.to(roomId).emit('chat:message', playMsg);
    });

    // QUEUE: REORDER
    socket.on('queue:reorder', async ({ itemIds }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const room = await RoomService.getRoom(roomId);
      if (!room || !participant.isHost) return;

      const updatedQueue = await RoomService.reorderQueue(roomId, itemIds);
      io.to(roomId).emit('queue:update', updatedQueue);
    });

    // ROOM: UPDATE SETTINGS (Host only)
    socket.on('room:update-settings', async (payload) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      if (!participant.isHost) {
        socket.emit('room:error', { message: 'Only the host can update room settings.' });
        return;
      }

      const settings = await RoomService.updateSettings(roomId, payload);
      if (settings) {
        io.to(roomId).emit('room:settings-updated', settings);
        const setMsg = ChatHandler.createSystemMessage(roomId, `Host updated room settings.`);
        io.to(roomId).emit('chat:message', setMsg);
      }
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

    // CHAT REACTION
    socket.on('chat:reaction', ({ messageId, emoji }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      const updatedReactions = ChatHandler.toggleReaction(roomId, messageId, emoji, participant.id);
      if (updatedReactions) {
        io.to(roomId).emit('chat:reaction-updated', { messageId, reactions: updatedReactions });
      }
    });

    // PARTICIPANT KICK (HOST ONLY)
    socket.on('participant:kick', async ({ participantId }) => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo || !participantInfo.participant.isHost) return;

      const { roomId } = participantInfo;
      const target = ParticipantManager.getParticipant(roomId, participantId);
      if (!target || target.isHost) return;

      const { updatedList } = ParticipantManager.removeParticipant(roomId, participantId);
      io.to(roomId).emit('participants:update', updatedList);

      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('room:closed', { reason: 'You were removed from the room by the host.' });
        targetSocket.leave(roomId);
      }

      const kickMsg = ChatHandler.createSystemMessage(roomId, `${target.name} was removed by the host.`);
      io.to(roomId).emit('chat:message', kickMsg);
    });

    // EXPLICIT ROOM LEAVE
    socket.on('room:leave', async () => {
      const participantInfo = ParticipantManager.getBySocketId(socket.id);
      if (!participantInfo) return;

      const { roomId, participant } = participantInfo;
      WebRtcSignalingManager.handleLeaveCall(io, roomId, participant.id);
      socket.leave(roomId);
      const { updatedList, newHostId } = ParticipantManager.removeParticipant(roomId, participant.id);
      if (newHostId) {
        await RoomService.updateHost(roomId, newHostId);
        io.to(roomId).emit('room:host-changed', { hostId: newHostId });
      }
      io.to(roomId).emit('participants:update', updatedList);

      const leaveMsg = ChatHandler.createSystemMessage(roomId, `${participant.name} left the room.`);
      io.to(roomId).emit('chat:message', leaveMsg);
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      ParticipantManager.handleDisconnect(socket.id, async (roomId, removedParticipant, updatedList) => {
        WebRtcSignalingManager.handleParticipantDisconnect(io, roomId, removedParticipant.id);
        if (removedParticipant.isHost && updatedList.length > 0) {
          updatedList[0].isHost = true;
          await RoomService.updateHost(roomId, updatedList[0].id);
          io.to(roomId).emit('room:host-changed', { hostId: updatedList[0].id });
        }
        io.to(roomId).emit('participants:update', updatedList);
        const leaveMsg = ChatHandler.createSystemMessage(roomId, `${removedParticipant.name} left the room.`);
        io.to(roomId).emit('chat:message', leaveMsg);
      });
    });
  });
}
