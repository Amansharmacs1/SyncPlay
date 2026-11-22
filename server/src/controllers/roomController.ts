import { Request, Response } from 'express';
import { RoomService } from '../services/roomService.js';
import { createRoomSchema, joinRoomSchema } from '../validators/roomValidator.js';
import { ParticipantManager } from '../socket/participantManager.js';

export class RoomController {
  /**
   * POST /api/rooms
   * Create a new room
   */
  public static async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const validated = createRoomSchema.parse(req.body);

      const { room, hostId } = await RoomService.createRoom({
        displayName: validated.displayName,
        roomName: validated.roomName,
        password: validated.password,
        visibility: validated.visibility,
      });

      res.status(201).json({
        success: true,
        data: {
          roomId: room.roomId,
          roomName: room.roomName,
          hostId,
          hasPassword: !!room.passwordHash,
          visibility: room.visibility,
          createdAt: room.createdAt,
        },
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, error: err.errors[0]?.message || 'Validation error' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Failed to create room' });
    }
  }

  /**
   * GET /api/rooms/:roomId
   * Fetch room info / verify existence
   */
  public static async getRoom(req: Request, res: Response): Promise<void> {
    try {
      const rawRoomId = req.params.roomId;
      const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
      if (!roomId) {
        res.status(400).json({ success: false, error: 'Room ID is required' });
        return;
      }
      const room = await RoomService.getRoom(roomId);

      if (!room) {
        res.status(404).json({ success: false, error: 'Room not found or expired' });
        return;
      }

      const activeParticipants = ParticipantManager.getParticipants(roomId);

      res.json({
        success: true,
        data: {
          roomId: room.roomId,
          roomName: room.roomName,
          hasPassword: !!room.passwordHash,
          isLocked: !!room.isLocked,
          allowParticipantControl: !!room.allowParticipantControl,
          visibility: room.visibility,
          participantCount: activeParticipants.length,
          media: room.media,
          queue: room.queue || [],
          createdAt: room.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch room' });
    }
  }

  /**
   * POST /api/rooms/:roomId/verify
   * Verify password before joining
   */
  public static async verifyPassword(req: Request, res: Response): Promise<void> {
    try {
      const rawRoomId = req.params.roomId;
      const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
      const { password } = req.body;

      if (!roomId) {
        res.status(400).json({ success: false, error: 'Room ID is required' });
        return;
      }

      const room = await RoomService.getRoom(roomId);
      if (!room) {
        res.status(404).json({ success: false, error: 'Room not found' });
        return;
      }

      if (!room.passwordHash) {
        res.json({ success: true, valid: true });
        return;
      }

      const isValid = await RoomService.verifyPassword(roomId, password);
      if (!isValid) {
        res.status(401).json({ success: false, valid: false, error: 'Incorrect room password' });
        return;
      }

      res.json({ success: true, valid: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
