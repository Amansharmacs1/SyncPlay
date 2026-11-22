const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CreateRoomParams {
  displayName: string;
  roomName?: string;
  password?: string;
  visibility?: 'public' | 'private';
}

export interface CreateRoomResponse {
  roomId: string;
  roomName: string;
  hostId: string;
  hasPassword: boolean;
  visibility: 'public' | 'private';
  createdAt: string;
}

export interface RoomInfoResponse {
  roomId: string;
  roomName: string;
  hasPassword: boolean;
  visibility: 'public' | 'private';
  participantCount: number;
  media: {
    type: 'youtube' | 'direct';
    url: string;
    title: string;
  };
  createdAt: string;
}

export const api = {
  async createRoom(params: CreateRoomParams): Promise<CreateRoomResponse> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create room');
    }
    return data.data;
  },

  async getRoom(roomId: string): Promise<RoomInfoResponse> {
    const res = await fetch(`${API_BASE}/rooms/${roomId.toUpperCase()}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Room not found');
    }
    return data.data;
  },

  async verifyPassword(roomId: string, password?: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/rooms/${roomId.toUpperCase()}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return false;
    }
    return data.valid === true;
  },
};
