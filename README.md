# SyncPlay — Cross-Platform Watch Party & Real-Time Video Calling Platform

> **"Watch together. Talk together. Anywhere."**

SyncPlay is a modern, cross-platform social watch-party web application. Friends and communities can watch synchronized YouTube videos and direct MP4/WebM video streams together in frame-accurate real time, communicate via low-latency text chat with emoji reactions, talk face-to-face through **real-time WebRTC video calling, voice chat, and screen sharing**, manage a **shared watch queue**, and install the platform as a **Progressive Web App (PWA)** — all with **absolutely zero user accounts or sign-up friction**.

**Built with passion by Aman Sharma**  
*Crafting digital experiences that bring people closer.*  
[Visit Developer Portfolio ↗](https://amansharma.space)

---

## 🌟 Comprehensive Features

### 🛡️ 100% Account-Free & Frictionless (Phase 3)
- **Zero Login Walls**: No sign-up, registration, email/password prompts, social login, or verification gates.
- **Instant Room Access**: Enter a display name, click "Create Room" or "Join Room", and start watching immediately.
- **Local Session Persistence**: Cryptographic anonymous identifiers (`user_<hex>`) stored locally in browser storage maintain session identity across reloads without server tracking.
- **Browser-Local Watch History**: Recently visited rooms are saved privately in client `localStorage` with 1-click rejoining and history management.

### 📋 Shared Watch Queue & Auto-Advance (Phase 3)
- **Multi-Source Queueing**: Add YouTube and direct MP4/WebM video stream URLs to the room queue.
- **Real-Time Reordering**: Hosts can easily reorder upcoming videos in the queue.
- **Permissions**: Both the host and the participant who added a video can delete it from the queue.
- **Auto-Advance Playback**: When the current video ends (`playback:ended`), the host's client triggers the room to pop and play the next queued item automatically.

### 🔒 Advanced Room Management & Host Controls (Phase 3)
- **Room Locking**: Hosts can lock rooms at any time to reject unexpected joiners (`ROOM_LOCKED`).
- **Shared Playback Controls**: Hosts can toggle `allowParticipantControl` so all guests can play, pause, and seek together.
- **Editable Room Name & Password**: Change room titles and update or remove passwords on the fly.
- **Web Share API**: Native mobile sharing via `navigator.share()` directly to messaging apps with automatic clipboard fallback.
- **Graceful Host Departure**: If a host leaves, the next connected guest is automatically promoted to host, keeping the party alive.

### 💬 Social Chat & Reactions (Phase 3)
- **Emoji Reactions**: React to any message with expressive emojis (`❤️`, `🔥`, `😂`, `👍`).
- **Smart Auto-Scroll**: Preserves scroll position when browsing chat history; auto-scrolls only when viewing the latest messages.
- **Unread Message Badges**: Tab badges notify users of new chat messages while they browse the Queue or People tabs.
- **Rate Limiting & Safety**: Client and server sliding-window limiters prevent spam while sanitizing content.

### 📱 Progressive Web App (PWA) (Phase 3)
- **Installable**: Full Web App Manifest (`manifest.json`) supporting desktop and mobile home screen installation.
- **Service Worker (`sw.js`)**: Pre-caches core app shell with Stale-While-Revalidate static asset caching and network-first navigation.
- **Offline Fallback (`offline.html`)**: Branded dark-first offline screen with one-click retry.
- **Intelligent Stream Bypassing**: Service worker bypasses WebSocket, Socket.IO, API endpoints, and media streaming chunks for uninterrupted real-time performance.
- **Install Prompt Banner**: In-app installation banner triggers on supported devices.

### 🎥 Real-Time Video Calling & Voice Chat (Phase 2)
- **Peer-to-Peer Full Mesh WebRTC**: Low-latency video calling and crystal-clear voice communication.
- **Hardware Controls**: Live microphone mute/unmute and camera toggles with initialed avatar fallback.
- **Active Speaker Detection**: Visual glow indicator driven by Web Audio API frequency analysis.
- **Screen Sharing**: Browser tab, window, or full-screen capture (`getDisplayMedia`) with seamless track replacement (`replaceTrack`).
- **Device Management & Pre-Join Preview**: Explicit pre-join selection, live test preview, and dynamic camera/mic/speaker switching (`setSinkId`).
- **Connection Quality Monitoring**: Real-time evaluation of RTT, packet loss, and jitter (`Excellent`, `Good`, `Poor`, `Reconnecting`).

### 🎬 Synchronized Video Playback (Phase 1)
- **Dual Media Engine**: Frame-accurate YouTube IFrame API and HTML5 native video element for `.mp4` and `.webm`.
- **Authoritative Drift Correction Engine**: Centralized server-authoritative time calculation preventing client drift.
- **Late-Joiner Synchronization**: New participants immediately receive authoritative playback state and current timestamp.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + custom glassmorphic dark-first theme
- **State Management**: Zustand (`useRoomStore`, `useCallStore`, `useToastStore`)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Real-Time Client**: Socket.IO Client
- **WebRTC**: Native W3C WebRTC (`RTCPeerConnection`, `MediaStream`, `getUserMedia`, `getDisplayMedia`, Web Audio API)
- **PWA**: Service Worker (`sw.js`) + Web App Manifest (`manifest.json`)

### Backend
- **Runtime**: Node.js v20+ / v22+
- **Framework**: Express.js + TypeScript
- **Real-Time Server**: Socket.IO (Signaling plane + Room coordination)
- **Database**: MongoDB & Mongoose (with automated in-memory MongoDB fallback for instant local dev & automated testing)
- **Validation**: Zod schema validation
- **Security**: Bcryptjs password hashing, CORS, rate limiting, input sanitization

---

## 📁 Project Architecture

```
SyncPlay/
├── client/                     # Vite + React + TypeScript frontend
│   ├── public/
│   │   ├── icons/              # PWA icons (192x192, 512x512, SVG)
│   │   ├── manifest.json       # Web App Manifest
│   │   ├── offline.html        # Dark-first offline fallback
│   │   └── sw.js               # Service Worker with intelligent stream bypass
│   ├── src/
│   │   ├── components/
│   │   │   ├── call/           # VideoGrid, CallToolbar, PreJoinModal, DeviceSettingsModal
│   │   │   ├── chat/           # ChatPanel, ChatMessageItem (Emoji reactions & smart scroll)
│   │   │   ├── common/         # Modals, Avatars, Toasts, PwaInstallPrompt, ConnectionIndicator
│   │   │   ├── landing/        # HeroSection, RecentRoomsSection, Features, HowItWorks
│   │   │   ├── layout/         # Navbar, Footer (with Aman Sharma developer portfolio)
│   │   │   ├── participants/   # ParticipantList
│   │   │   ├── player/         # VideoPlayer, YouTubePlayer, DirectVideoPlayer, Controls
│   │   │   └── room/           # RoomHeader, WatchQueuePanel, RoomSettingsModal, InviteModal
│   │   ├── pages/              # LandingPage, WatchRoomPage, NotFoundPage
│   │   ├── services/           # WebRTCManager, socketService, api, recentRoomsService
│   │   ├── stores/             # Zustand stores (useRoomStore, useCallStore, useToastStore)
│   │   └── types/              # Frontend TypeScript definitions
│   └── package.json
├── server/                     # Express + Socket.IO + TypeScript backend
│   ├── src/
│   │   ├── config/             # Database connection & ICE server configuration
│   │   ├── controllers/        # REST roomController, webrtcController
│   │   ├── models/             # Mongoose schemas (Room, ChatMessage)
│   │   ├── services/           # RoomService business logic
│   │   ├── socket/             # Socket.IO handlers, WebRtcSignalingManager, SyncEngine, ParticipantManager, ChatHandler
│   │   ├── types/              # Backend TypeScript definitions
│   │   └── server.ts           # HTTP & WebSocket bootstrap
│   ├── test/                   # Comprehensive automated test suites
│   │   ├── sync.test.ts            # Unit & sync engine test
│   │   ├── e2e-simulation.test.ts  # Multi-client playback & chat simulation
│   │   ├── webrtc-signaling.test.ts# WebRTC mesh signaling & media status test
│   │   └── phase3-features.test.ts # Queue, locks, shared controls & reactions test
│   └── package.json
├── docs/                       # Comprehensive Technical Documentation
│   ├── phase-3.md              # Phase 3 architecture & no-login philosophy
│   ├── room-management.md      # Room lifecycle, host controls, departure vs termination
│   ├── privacy-and-security.md # Zero-login architecture & cryptographic identities
│   ├── pwa.md                  # Progressive Web App spec & caching rules
│   ├── webrtc-architecture.md  # WebRTC mesh topology & negotiation details
│   ├── signaling-events.md     # Socket.IO signaling event specifications
│   ├── media-permissions.md    # Camera & Microphone permission lifecycle
│   ├── troubleshooting.md      # Diagnosing connection & audio/video issues
│   └── deployment.md           # Cloud deployment & TURN relay guide
├── package.json                # Root orchestration package
└── README.md
```

---

## 🚀 Quick Start & Local Development

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

SyncPlay features 4 automated test suites covering all system layers:

1. **Phase 3 Feature Test Suite** (Queue, Room Locks, Shared Controls, Reactions):
   ```bash
   npm run test:phase3 --prefix server
   ```

2. **WebRTC Signaling & Media Status Test Suite**:
   ```bash
   npm run test:webrtc --prefix server
   ```

3. **Full Multi-Client E2E Simulation**:
   ```bash
   npm run test:e2e --prefix server
   ```

4. **Core Unit & Sync Engine Tests**:
   ```bash
   npm run test --prefix server
   ```

5. **Run All Test Suites**:
   ```bash
   npm run test:all --prefix server
   ```

6. **Full Production Build Verification**:
   ```bash
   npm run build
   ```

---

## 👨‍💻 Developer Attribution

**Built with passion by Aman Sharma**  
*Crafting digital experiences that bring people closer.*  
- **Website**: [https://amansharma.space](https://amansharma.space)
- **Role**: Full-Stack Real-Time Architect & UI/UX Engineer

---

## 📄 License

SyncPlay is open-source software licensed under the MIT License.
