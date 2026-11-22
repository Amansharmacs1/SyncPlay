# SyncPlay — Cross-Platform Watch Party & Real-Time Video Calling Platform

> **"Watch together. Talk together. Anywhere."**

SyncPlay is a modern, real-time, cross-platform social watch-party web application. Friends and communities can watch synchronized YouTube videos and direct MP4/WebM video streams together in frame-accurate real time, communicate via low-latency text chat, and talk face-to-face through **real-time WebRTC video calling, voice chat, and screen sharing**.

---

## 🌟 Comprehensive Features

### 🎥 Real-Time Video Calling & Voice Chat (Phase 2)
- **Peer-to-Peer Full Mesh WebRTC**: Zero-relay latency audio/video communication directly between room participants.
- **Hardware Controls**:
  - Live microphone mute/unmute with visual warning indicators.
  - Camera enable/disable with generated initials avatar fallback.
  - Active speaker detection: Glowing animated indicator driven by Web Audio API frequency analysis.
- **Screen Sharing**:
  - Browser tab, application window, or full-screen capture (`getDisplayMedia`).
  - Seamless track swapping (`RTCRtpSender.replaceTrack`) without renegotiation glare or disruption.
  - Graceful fallback for mobile browsers where display capture is restricted.
- **Device Management & Pre-Join Permission Flow**:
  - Explicit pre-join selection: *"Join with Camera & Mic"*, *"Join with Mic Only"*, or *"Join Without Audio/Video"*.
  - Device test preview (live camera preview and audio level meter).
  - Dynamic device selection (switch between connected cameras, microphones, and output speakers via `setSinkId`).
- **Connection Quality Monitoring**:
  - Real-time `pc.getStats()` monitoring evaluating Round-Trip Time (RTT), packet loss, and jitter.
  - Visual status badges: `Excellent`, `Good`, `Poor`, and `Reconnecting`.
  - Configurable media quality presets: *Low Bandwidth (240p 15fps)*, *Balanced (480p 24fps)*, and *High Quality (720p 30fps)*.
- **Separation of Concerns**:
  - Leaving a video call keeps watch room and synchronized video playback intact.
  - Host-only controls to end the room for everyone.

### 🎬 Synchronized Video Playback (Phase 1)
- **Dual Media Engine**:
  - **YouTube IFrame API**: Official embed API with automatic ID extraction from watch URLs, shortlinks, and embeds.
  - **HTML5 Direct Video**: Native support for direct `.mp4` and `.webm` video URLs.
- **Authoritative Playback Synchronization Engine**:
  - Centralized server-authoritative time calculation preventing client drift.
  - Intelligent drift correction: Gentle drift handling for small variations; instant frame seeking for large offsets.
  - Host-governed controls with automatic state broadcast and loop prevention (`isInternalSync` flags).
  - Late-joiner synchronization: New participants immediately receive the authoritative playback state and current timestamp.

### 💬 Social Chat, Presence & Security
- Low-latency chat powered by Socket.IO with HTML entity sanitization and sliding-window rate limiting.
- Real-time participant roster showing online status, join time, and host indicators.
- Reconnection grace period to prevent flickering and ghost participants on browser reload.
- Cryptographically random room codes (e.g. `CDPG7M`), optional passwords hashed with `bcryptjs`, and public/private room visibility.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + custom glassmorphic utilities
- **State Management**: Zustand (`useRoomStore`, `useCallStore`, `useToastStore`)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Real-Time Client**: Socket.IO Client
- **WebRTC**: Native W3C WebRTC (`RTCPeerConnection`, `MediaStream`, `getUserMedia`, `getDisplayMedia`, Web Audio API)

### Backend
- **Runtime**: Node.js v20+ / v22+
- **Framework**: Express.js + TypeScript
- **Real-Time Server**: Socket.IO (Signaling plane + Room coordination)
- **Database**: MongoDB & Mongoose (with seamless `mongodb-memory-server` fallback for instant local dev & automated testing)
- **Validation**: Zod schema validation
- **Security**: Bcryptjs password hashing, CORS, rate limiting, and input sanitization

---

## 📁 Project Architecture

```
SyncPlay/
├── client/                     # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── call/           # ParticipantTile, VideoGrid, CallToolbar, PreJoinModal, DeviceSettingsModal
│   │   │   ├── common/         # Modals, Avatars, Toasts, Status Indicators
│   │   │   ├── layout/         # Navbar, Footer
│   │   │   ├── landing/        # HeroSection, WatchRoomPreview, Features, HowItWorks
│   │   │   ├── player/         # VideoPlayer, YouTubePlayer, DirectVideoPlayer, Controls
│   │   │   ├── chat/           # ChatPanel, ChatMessageItem
│   │   │   ├── participants/   # ParticipantList
│   │   │   └── room/           # RoomHeader, MediaSelectModal, InviteModal
│   │   ├── pages/              # LandingPage, WatchRoomPage, NotFoundPage
│   │   ├── services/
│   │   │   ├── webrtc/         # WebRTCManager, PeerConnection, MediaManager, ScreenShareManager, SignalingService
│   │   │   ├── api.ts          # REST client
│   │   │   └── socket.ts       # Socket.IO client
│   │   ├── stores/             # Zustand stores (useRoomStore, useCallStore, useToastStore)
│   │   ├── types/              # Frontend TypeScript definitions
│   │   ├── utils/              # YouTube ID extractor, MP4 validator, time formatter
│   │   ├── App.tsx             # Route definitions & global toast container
│   │   └── main.tsx            # React root mount
├── server/                     # Express + Socket.IO + TypeScript backend
│   ├── src/
│   │   ├── config/             # Database connection & STUN/TURN ICE server configuration
│   │   ├── controllers/        # REST roomController, webrtcController
│   │   ├── middleware/         # Error handler & CORS
│   │   ├── models/             # Mongoose schemas (Room, ChatMessage)
│   │   ├── routes/             # REST endpoints (/api/rooms, /api/webrtc, /health)
│   │   ├── services/           # RoomService business logic
│   │   ├── socket/             # Socket.IO handlers, WebRtcSignalingManager, SyncEngine, ParticipantManager, ChatHandler
│   │   ├── types/              # Backend TypeScript definitions
│   │   ├── utils/              # Cryptographic ID generator & logger
│   │   ├── validators/         # Zod schemas
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # HTTP & WebSocket bootstrap
│   ├── test/                   # Unit tests, E2E multi-client simulation, WebRTC signaling tests
│   ├── package.json
│   └── tsconfig.json
├── docs/                       # Technical & Architectural Documentation
│   ├── architecture.md         # Overall system architecture
│   ├── webrtc-architecture.md  # WebRTC mesh topology & negotiation details
│   ├── signaling-events.md     # Socket.IO signaling event specifications
│   ├── media-permissions.md    # Camera & Microphone permission lifecycle
│   ├── troubleshooting.md      # Diagnosing connection & audio/video issues
│   └── deployment.md           # Cloud deployment & TURN relay guide
├── package.json                # Root orchestration package
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 1. Installation
```bash
git clone <repo-url>
cd SyncPlay
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Run Locally
```bash
npm run dev
```
- **Client (Frontend)**: `http://localhost:5173`
- **Server (Backend API & WebSocket)**: `http://localhost:5000`

---

## 🧪 Automated Testing

SyncPlay includes three automated test suites:

1. **WebRTC Signaling & Media Status Test Suite**:
   ```bash
   npm run test:webrtc --prefix server
   ```
   Tests peer joining, SDP offer/answer relay, ICE candidate exchange, mic/camera/screenshare toggling, and clean call departure.

2. **Full Multi-Client E2E Simulation**:
   ```bash
   npm run test:e2e --prefix server
   ```
   Tests room creation, participant joining, frame-accurate play/pause/seek synchronization, chat exchange, and late-joiner synchronization.

3. **Core Unit & Sync Engine Tests**:
   ```bash
   npm run test --prefix server
   ```
   Tests cryptographic room ID generation, drift math, duplicate participant prevention, and chat sanitization.

4. **Production Build Verification**:
   ```bash
   npm run build
   ```
   Compiles both server and client with zero TypeScript or asset bundle errors.

---

## 🌐 Production Deployment

See [docs/deployment.md](docs/deployment.md) for full instructions.

- **Frontend (Vercel / Netlify)**: Build command `npm run build`, output directory `dist`.
- **Backend (Render / Railway)**: Build command `npm run build`, start command `npm run start`.
- **TURN Relay**: Provide `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL` in backend environment variables. The server securely exposes ICE servers via `/api/webrtc/ice-servers` without leaking secrets in frontend code.
