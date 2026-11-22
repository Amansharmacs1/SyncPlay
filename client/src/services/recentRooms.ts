export interface RecentRoom {
  roomId: string;
  roomName: string;
  lastVisited: number;
  joinedAt?: number;
  mediaTitle?: string;
  isHost?: boolean;
}

const STORAGE_KEY = 'syncplay_recent_rooms';
const MAX_RECENT_ROOMS = 8;

export const recentRoomsService = {
  /**
   * Retrieves the user's browser-local recently visited rooms.
   */
  getRecentRooms(): RecentRoom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => (b.lastVisited || b.joinedAt || 0) - (a.lastVisited || a.joinedAt || 0));
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Saves or updates a room entry in browser storage.
   */
  saveRecentRoom(entry: {
    roomId: string;
    roomName: string;
    isHost?: boolean;
    joinedAt?: number;
    mediaTitle?: string;
  }): void {
    try {
      const current = this.getRecentRooms().filter(
        (r) => r.roomId.toUpperCase() !== entry.roomId.toUpperCase()
      );

      const now = entry.joinedAt || Date.now();
      const updated: RecentRoom = {
        roomId: entry.roomId.toUpperCase(),
        roomName: entry.roomName || 'Watch Party',
        lastVisited: now,
        joinedAt: now,
        mediaTitle: entry.mediaTitle,
        isHost: entry.isHost || false,
      };

      const newList = [updated, ...current].slice(0, MAX_RECENT_ROOMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (err) {
      console.warn('[RecentRooms] Failed to persist room to localStorage:', err);
    }
  },

  /**
   * Removes a specific room by ID.
   */
  removeRecentRoom(roomId: string): void {
    try {
      const filtered = this.getRecentRooms().filter(
        (r) => r.roomId.toUpperCase() !== roomId.toUpperCase()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn('[RecentRooms] Failed to remove room from localStorage:', err);
    }
  },

  /**
   * Clears the entire list of recently visited rooms.
   */
  clearRecentRooms(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[RecentRooms] Failed to clear rooms from localStorage:', err);
    }
  },
};
