# SyncPlay — Phase 3: Product Expansion, Polish & Production Readiness

SyncPlay is a modern, cross-platform social watch-party web application that allows friends to watch videos together, talk face-to-face via WebRTC video calling and voice chat, and share reactions in real time.

**Tagline:** Watch together. Talk together. Anywhere.  
**Developer:** Built with passion by Aman Sharma ([https://amansharma.space](https://amansharma.space))

---

## 1. Core Architectural Philosophy: 100% Account-Free (No Login)

SyncPlay adheres to a strict **zero-friction, account-free** philosophy:
- **No Sign-Up or Registration**: Users never face email/password forms, OAuth prompts (Google/GitHub/Apple), or account creation walls.
- **Instant Access**: Users enter a display name and immediately create or join a watch party.
- **Cryptographic Anonymous Sessions**: Per-device identity is established locally via `crypto.randomUUID()` or secure random hex identifiers (`user_<hex>`), stored in browser `localStorage`.
- **Stateless Rooms & Ephemeral State**: Room participants are managed dynamically via Socket.IO connection presence, with optional room passwords for access control.
- **Local History**: Recently visited rooms are saved strictly in the client's local browser storage (`syncplay_recent_rooms`) without server-side tracking, enabling 1-click rejoining.

---

## 2. Shared Watch Queue & Auto-Advance

SyncPlay Phase 3 introduces a collaborative watch queue system:
- **Multi-Source Queueing**: Supports both YouTube video URLs and direct MP4/WebM video stream URLs.
- **Item Metadata**: Displays video title, video type badge, duration, and the display name of the participant who added the video.
- **Dynamic Reordering**: Room hosts can reorder upcoming videos up or down in real time.
- **Removal Permissions**: Both the room host and the participant who queued a video can delete that item from the queue.
- **Seamless Auto-Advance**: When the current video finishes playing (`playback:ended`), the host's client signals the server to pop the next video in the queue, broadcasting `room:media-changed` to keep everyone synchronized without manual intervention.

---

## 3. Advanced Room Management & Host Permissions

Hosts maintain granular control over their watch rooms:
- **Room Locking (`isLocked`)**: Hosts can lock their room at any time. When locked, new joiners are immediately rejected with error code `ROOM_LOCKED`.
- **Shared Playback Controls (`allowParticipantControl`)**: By default, only the host controls play, pause, and seek. Hosts can toggle shared controls in Room Settings to allow all participants to control the stream.
- **Editable Room Name**: Hosts can rename the room on the fly with real-time propagation to all connected peers.
- **Password Updates & Removal**: Hosts can set, change, or remove room passwords without restarting the session.
- **Web Share API**: Native device sharing via `navigator.share()` allows instant sharing directly to messaging apps, with fallback to clipboard copying.
- **Graceful Host Departure**: If a host leaves, host permissions are automatically transferred to the next connected participant, preserving the party for remaining guests.

---

## 4. Enhanced Chat Experience

The real-time text chat has been enhanced with social and interactive features:
- **Emoji Reactions**: Participants can react to any chat message with expressive emojis (`❤️`, `🔥`, `😂`, `👍`). Clicking an existing emoji badge toggles the reaction in real time.
- **Smart Auto-Scroll**: The chat window automatically stays pinned to the latest message only if the user is already scrolled to the bottom. If the user scrolls up to read chat history, the scroll position is preserved, and a floating *"New messages ↓"* badge appears.
- **Host Badges & Timestamps**: Clear sender names, message timestamps, and host identification badges.
- **Rate Limiting & Length Limits**: Client- and server-side rate limiters prevent message spam (max 5 messages per 3 seconds; max 500 characters per message).
- **Unread Message Counter**: Tab badges notify users of new chat messages while they are viewing the Watch Queue or People tabs.

---

## 5. Progressive Web App (PWA) & Offline Shell

SyncPlay is fully installable as a Progressive Web App across desktop and mobile browsers:
- **Web App Manifest (`manifest.json`)**: Configured for `standalone` display, dark theme `#0B0B12`, categories (`entertainment`, `social`), and responsive icons (192x192, 512x512, SVG).
- **Service Worker (`sw.js`)**: Pre-caches the core application shell (`/`, `/index.html`, `/offline.html`, icons) using Stale-While-Revalidate caching for static assets.
- **Network-First Navigation**: HTML page transitions use network-first strategy with automatic fallback to `/offline.html` when network connectivity drops.
- **Smart Stream Bypassing**: The service worker explicitly bypasses caching for WebSocket/Socket.IO connections (`/socket.io/*`), API requests (`/api/*`), WebRTC signaling, YouTube embeds, and media streaming chunks to prevent latency or buffer conflicts.
- **Install Prompt Banner**: Responsive `PwaInstallPrompt` component detects `beforeinstallprompt` and allows 1-click home-screen installation.

---

## 6. Developer Portfolio & Attribution

In accordance with SyncPlay's open-source and professional standards, the platform features a dedicated developer footer:
- **Attribution**: Built with passion by Aman Sharma
- **Statement**: Crafting digital experiences that bring people closer.
- **Portfolio Link**: [https://amansharma.space](https://amansharma.space)
- **Label**: Visit Developer Portfolio ↗
- **Attributes**: `target="_blank" rel="noopener noreferrer"`
