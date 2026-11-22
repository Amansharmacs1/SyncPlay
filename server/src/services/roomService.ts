import bcrypt from 'bcryptjs';
import { RoomModel, IRoomDoc } from '../models/Room.js';
import { MediaState, PlaybackState, RoomData } from '../types/index.js';
import { generateRoomId, generateParticipantId } from '../utils/idGenerator.js';

export class RoomService {
  /**
   * Creates a new room with a secure unique ID and initial playback state.
   */
  public static async createRoom(params: {
    displayName: string;
    roomName?: string;
    password?: string;
    visibility?: 'public' | 'private';
  }): Promise<{ room: IRoomDoc; hostId: string }> {
    const hostId = generateParticipantId();
    let roomId = generateRoomId();

    // Ensure uniqueness
    let exists = await RoomModel.findOne({ roomId });
    while (exists) {
      roomId = generateRoomId();
      exists = await RoomModel.findOne({ roomId });
    }

    let passwordHash: string | null = null;
    if (params.password && params.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(params.password.trim(), 10);
    }

    const defaultRoomName = params.roomName?.trim() || `${params.displayName}'s Room`;

    const room = await RoomModel.create({
      roomId,
      roomName: defaultRoomName,
      hostId,
      passwordHash,
      visibility: params.visibility || 'public',
      media: {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=L_LUpnjgPso', // Creative Commons 4K cinematic nature
        title: 'Cinematic Nature - 4K Relaxing Video',
        duration: 0,
      },
      playbackState: {
        status: 'paused',
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1,
      },
    });

    return { room, hostId };
  }

  /**
   * Finds a room by ID.
   */
  public static async getRoom(roomId: string): Promise<IRoomDoc | null> {
    return RoomModel.findOne({ roomId: roomId.toUpperCase() });
  }

  /**
   * Checks if password is valid for protected rooms.
   */
  public static async verifyPassword(roomId: string, password?: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) return false;
    if (!room.passwordHash) return true; // Room has no password
    if (!password) return false;
    return bcrypt.compare(password, room.passwordHash);
  }

  /**
   * Updates current media.
   */
  public static async updateMedia(roomId: string, media: MediaState): Promise<IRoomDoc | null> {
    return RoomModel.findOneAndUpdate(
      { roomId: roomId.toUpperCase() },
      {
        $set: {
          media,
          'playbackState.status': 'paused',
          'playbackState.currentTime': 0,
          'playbackState.lastUpdated': Date.now(),
        },
      },
      { new: true }
    );
  }

  /**
   * Updates playback state.
   */
  public static async updatePlayback(roomId: string, state: PlaybackState): Promise<IRoomDoc | null> {
    return RoomModel.findOneAndUpdate(
      { roomId: roomId.toUpperCase() },
      {
        $set: {
          playbackState: state,
        },
      },
      { new: true }
    );
  }

  /**
   * Deletes a room.
   */
  public static async deleteRoom(roomId: string): Promise<boolean> {
    const res = await RoomModel.deleteOne({ roomId: roomId.toUpperCase() });
    return res.deletedCount > 0;
  }
}
