# SyncPlay Overall System Architecture

SyncPlay is a high-performance, real-time social watch-party web platform that combines server-authoritative media playback synchronization with peer-to-peer WebRTC video calling, voice communication, screen sharing, and low-latency text chat.

```
                     +---------------------------------------+
                     |           Client Browser              |
                     |  (React 18 + TypeScript + Zustand)    |
                     +---+-------------------------------+---+
                         |                               |
             HTTPS / REST|                               | WebRTC Media Stream
             & WebSocket |                               | (P2P Audio/Video/Screen)
                         v                               v
             +-----------+-----------+       +-----------+-----------+
             |    Node.js Express    |       |      Remote Peer      |
             |   + Socket.IO Server  |       |     (Participant)     |
             +-----------+-----------+       +-----------------------+
                         |
                         v
             +-----------+-----------+
             |    MongoDB Database   |
             | (Rooms, Chat History) |
             +-----------------------+
```

## System Components

### 1. Frontend Client
- **Framework**: React 18 with Vite and TypeScript.
- **State Management**:
  - `useRoomStore`: Manages room metadata, participant presence, authoritative playback state, and chat history.
  - `useCallStore`: Manages WebRTC call state, local/screen streams, remote peer streams, device settings, audio activity, and layout.
  - `useToastStore`: Global user-facing notification queue.
- **Media Engines**:
  - Official YouTube IFrame Player API.
  - HTML5 native video element for direct `.mp4` and `.webm` streams.
- **WebRTC Service Layer**:
  - `WebRTCManager`: Singleton orchestrator.
  - `MediaManager`: Hardware device enumeration, `getUserMedia`, track muting, and Web Audio API voice activity analysis.
  - `ScreenShareManager`: `getDisplayMedia`, track swap, and fallback handlers.
  - `SignalingService`: Socket.IO signaling event dispatcher.
  - `PeerConnection`: Individual peer connection wrapper with SDP offer/answer negotiation, candidate queuing, and connection quality statistics.

### 2. Backend Server
- **Runtime**: Node.js with TypeScript and Express.js.
- **Real-Time Communication**: Socket.IO for room coordination and WebRTC signaling.
- **Sync Engine**:
  - Computes server-authoritative playback position dynamically:
    $$\text{time}_{\text{auth}} = \text{currentTime} + \frac{\text{Date.now}() - \text{lastUpdated}}{1000} \times \text{playbackRate}$$
  - Periodically broadcasts drift-correction heartbeats to all participants.
- **WebRTC Signaling Manager**:
  - Enforces call capacity limits (default: 8 participants in mesh).
  - Authenticates signaling payloads to prevent spoofing or unauthorized track injection.
  - Tracks call participants independently from watch room presence.
- **Persistence**: MongoDB with Mongoose (with automated development/test fallback to `mongodb-memory-server`).
