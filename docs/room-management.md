# Room Management & Lifecycle Guide — SyncPlay

SyncPlay is designed for zero-friction room creation, dynamic guest participation, and resilient room state management without user accounts.

---

## 1. Room Lifecycle

```
[Create Room] (POST /api/rooms)
      │
      ▼
[Active Watch Room] (Socket.IO Room)
      │
      ├── [Participant Joins] ──> PeerConnection established (Mesh WebRTC)
      │
      ├── [Queue Management]  ──> Add / Reorder / Auto-advance next media
      │
      ├── [Host Updates Settings] ──> Lock room / Toggle participant controls
      │
      ├── [Participant Leaves] ──> PeerConnection torn down, room continues
      │
      └── [Host Leaves]
            ├── If remaining participants > 0: Next participant becomes Host
            └── If room becomes empty: Room state marked inactive / cleaned up
```

---

## 2. Host Capabilities & Controls

| Feature | Description | Permission |
| :--- | :--- | :--- |
| **Change Video** | Replaces current playing media with a new YouTube or MP4 URL | Host (or participants if shared controls enabled) |
| **Watch Queue** | Adds, deletes, reorders upcoming videos | Host (and queue creator for item deletion) |
| **Room Lock** | Rejects any new participants attempting to enter | Host only |
| **Shared Controls** | Grants participants playback play/pause/seek controls | Host only |
| **Rename Room** | Updates room title in real time | Host only |
| **Room Password** | Sets, changes, or removes room password | Host only |
| **Kick Participant** | Removes a participant from the room | Host only |

---

## 3. Room Departure vs Termination

1. **Guest Leaves**:
   - WebRTC media tracks and peer connections are stopped for that guest.
   - Socket emits `room:leave` or disconnects.
   - Remaining participants receive `room:participant-left`.
   - The room continues uninterrupted.

2. **Host Leaves**:
   - Host emits `room:leave` or closes tab.
   - The server inspects the remaining participants list.
   - The oldest joined participant is promoted to the new host.
   - Server broadcasts `room:host-changed` and updated `room:state`.
   - If the room is empty, the room is safely garbage collected.
