import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { RoomModel, IRoomDoc } from '../models/Room.js';
import { MediaState, PlaybackState, QueueItem, RoomSettings } from '../types/index.js';
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
      isLocked: false,
      allowParticipantControl: true,
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
      queue: [],
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
   * Updates room settings (name, password, isLocked, allowParticipantControl, visibility).
   */
  public static async updateSettings(
    roomId: string,
    params: {
      roomName?: string;
      password?: string;
      removePassword?: boolean;
      isLocked?: boolean;
      allowParticipantControl?: boolean;
      visibility?: 'public' | 'private';
    }
  ): Promise<RoomSettings | null> {
    const norm = roomId.toUpperCase();
    const updateObj: any = {};

    if (params.roomName !== undefined && params.roomName.trim().length > 0) {
      updateObj.roomName = params.roomName.trim();
    }
    if (params.removePassword) {
      updateObj.passwordHash = null;
    } else if (params.password !== undefined && params.password.trim().length > 0) {
      updateObj.passwordHash = await bcrypt.hash(params.password.trim(), 10);
    }
    if (params.isLocked !== undefined) {
      updateObj.isLocked = params.isLocked;
    }
    if (params.allowParticipantControl !== undefined) {
      updateObj.allowParticipantControl = params.allowParticipantControl;
    }
    if (params.visibility !== undefined) {
      updateObj.visibility = params.visibility;
    }

    const updated = await RoomModel.findOneAndUpdate(
      { roomId: norm },
      { $set: updateObj },
      { new: true }
    );

    if (!updated) return null;

    return {
      roomName: updated.roomName,
      hasPassword: !!updated.passwordHash,
      isLocked: updated.isLocked,
      allowParticipantControl: updated.allowParticipantControl,
      visibility: updated.visibility,
    };
  }

  /**
   * Add video to watch queue.
   */
  public static async addToQueue(roomId: string, item: QueueItem): Promise<QueueItem[]> {
    const updated = await RoomModel.findOneAndUpdate(
      { roomId: roomId.toUpperCase() },
      { $push: { queue: item } },
      { new: true }
    );
    return updated ? updated.queue : [];
  }

  /**
   * Remove video from watch queue.
   */
  public static async removeFromQueue(roomId: string, itemId: string): Promise<QueueItem[]> {
    const updated = await RoomModel.findOneAndUpdate(
      { roomId: roomId.toUpperCase() },
      { $pull: { queue: { id: itemId } } },
      { new: true }
    );
    return updated ? updated.queue : [];
  }

  /**
   * Reorder watch queue.
   */
  public static async reorderQueue(roomId: string, itemIds: string[]): Promise<QueueItem[]> {
    const room = await this.getRoom(roomId);
    if (!room) return [];

    const itemMap = new Map(room.queue.map((item) => [item.id, item]));
    const reordered: QueueItem[] = [];

    for (const id of itemIds) {
      const item = itemMap.get(id);
      if (item) {
        reordered.push(item);
        itemMap.delete(id);
      }
    }

    // Append any remaining items
    for (const remaining of itemMap.values()) {
      reordered.push(remaining);
    }

    room.queue = reordered;
    await room.save();
    return reordered;
  }

  /**
   * Pop and advance to the next video in the queue.
   */
  public static async popNextFromQueue(roomId: string): Promise<{ nextMedia: MediaState | null; queue: QueueItem[] }> {
    const room = await this.getRoom(roomId);
    if (!room || room.queue.length === 0) {
      return { nextMedia: null, queue: [] };
    }

    const nextItem = room.queue.shift()!;
    const nextMedia: MediaState = {
      type: nextItem.type,
      url: nextItem.url,
      title: nextItem.title,
      duration: nextItem.duration || 0,
    };

    room.media = nextMedia;
    room.playbackState = {
      status: 'playing',
      currentTime: 0,
      lastUpdated: Date.now(),
      playbackRate: 1,
    };

    await room.save();
    return { nextMedia, queue: room.queue };
  }

  /**
   * Updates the host of a room.
   */
  public static async updateHost(roomId: string, newHostId: string): Promise<boolean> {
    if (mongoose.connection.readyState !== 1) return false;
    const room = await this.getRoom(roomId);
    if (!room) return false;
    room.hostId = newHostId;
    await room.save();
    return true;
  }

  /**
   * Deletes a room.
   */
  public static async deleteRoom(roomId: string): Promise<boolean> {
    const res = await RoomModel.deleteOne({ roomId: roomId.toUpperCase() });
    return res.deletedCount > 0;
  }
}
