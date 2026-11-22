import { PlaybackState, PlaybackStatus } from '../types/index.js';
import { RoomService } from '../services/roomService.js';
import mongoose from 'mongoose';

export interface AuthoritativeRoomState {
  status: PlaybackStatus;
  currentTime: number; // In seconds
  lastUpdated: number; // Unix ms
  playbackRate: number;
  duration?: number;
}

export class SyncEngine {
  // In-memory cache for fast real-time access
  private static roomStates: Map<string, AuthoritativeRoomState> = new Map();

  /**
   * Initializes or gets the authoritative state for a room.
   */
  public static async getAuthoritativeState(roomId: string): Promise<PlaybackState> {
    const cached = this.roomStates.get(roomId);
    if (cached) {
      return this.computeCurrentPlaybackState(cached);
    }

    // Load from DB
    const room = await RoomService.getRoom(roomId);
    if (room && room.playbackState) {
      const state: AuthoritativeRoomState = {
        status: room.playbackState.status,
        currentTime: room.playbackState.currentTime || 0,
        lastUpdated: room.playbackState.lastUpdated || Date.now(),
        playbackRate: room.playbackState.playbackRate || 1,
      };
      this.roomStates.set(roomId, state);
      return this.computeCurrentPlaybackState(state);
    }

    // Default fallback
    const defaultState: AuthoritativeRoomState = {
      status: 'paused',
      currentTime: 0,
      lastUpdated: Date.now(),
      playbackRate: 1,
    };
    this.roomStates.set(roomId, defaultState);
    return defaultState;
  }

  /**
   * Computes current time dynamically if the video is currently playing.
   */
  public static computeCurrentPlaybackState(state: AuthoritativeRoomState): PlaybackState {
    let calculatedTime = state.currentTime;

    if (state.status === 'playing') {
      const elapsedSeconds = Math.max(0, (Date.now() - state.lastUpdated) / 1000);
      calculatedTime += elapsedSeconds * state.playbackRate;
      if (state.duration && calculatedTime >= state.duration) {
        calculatedTime = state.duration;
        state.status = 'paused';
      }
    }

    return {
      status: state.status,
      currentTime: Math.max(0, calculatedTime),
      lastUpdated: Date.now(),
      playbackRate: state.playbackRate,
    };
  }

  /**
   * Updates state when Host plays.
   */
  public static async handlePlay(roomId: string, reportedTime: number): Promise<PlaybackState> {
    const currentState = await this.getAuthoritativeState(roomId);
    const validTime = Math.max(0, reportedTime ?? currentState.currentTime);

    const newState: AuthoritativeRoomState = {
      ...currentState,
      status: 'playing',
      currentTime: validTime,
      lastUpdated: Date.now(),
    };

    this.roomStates.set(roomId, newState);
    // Asynchronously persist to DB if connected
    if (mongoose.connection.readyState === 1) {
      RoomService.updatePlayback(roomId, newState).catch((err) =>
        console.error(`[SyncEngine] Failed to persist play state for room ${roomId}:`, err)
      );
    }

    return newState;
  }

  /**
   * Updates state when Host pauses.
   */
  public static async handlePause(roomId: string, reportedTime: number): Promise<PlaybackState> {
    const currentState = await this.getAuthoritativeState(roomId);
    // Use the reported time or the calculated authoritative time
    const computed = this.computeCurrentPlaybackState(currentState);
    const finalTime = Math.max(0, reportedTime ?? computed.currentTime);

    const newState: AuthoritativeRoomState = {
      ...currentState,
      status: 'paused',
      currentTime: finalTime,
      lastUpdated: Date.now(),
    };

    this.roomStates.set(roomId, newState);
    if (mongoose.connection.readyState === 1) {
      RoomService.updatePlayback(roomId, newState).catch((err) =>
        console.error(`[SyncEngine] Failed to persist pause state for room ${roomId}:`, err)
      );
    }

    return newState;
  }

  /**
   * Updates state when Host seeks.
   */
  public static async handleSeek(roomId: string, seekTime: number): Promise<PlaybackState> {
    const currentState = await this.getAuthoritativeState(roomId);
    const targetTime = Math.max(0, seekTime);

    const newState: AuthoritativeRoomState = {
      ...currentState,
      currentTime: targetTime,
      lastUpdated: Date.now(),
    };

    this.roomStates.set(roomId, newState);
    if (mongoose.connection.readyState === 1) {
      RoomService.updatePlayback(roomId, newState).catch((err) =>
        console.error(`[SyncEngine] Failed to persist seek state for room ${roomId}:`, err)
      );
    }

    return newState;
  }

  /**
   * Resets playback state when media is changed.
   */
  public static async resetMediaState(roomId: string, duration = 0): Promise<PlaybackState> {
    const newState: AuthoritativeRoomState = {
      status: 'paused',
      currentTime: 0,
      lastUpdated: Date.now(),
      playbackRate: 1,
      duration,
    };

    this.roomStates.set(roomId, newState);
    return newState;
  }

  /**
   * Cleans up room state when room closes.
   */
  public static removeRoom(roomId: string): void {
    this.roomStates.delete(roomId);
  }
}
