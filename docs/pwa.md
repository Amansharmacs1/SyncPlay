# Progressive Web App (PWA) Implementation — SyncPlay

SyncPlay is engineered as an installable Progressive Web App (PWA) that provides a native-like experience across iOS, Android, macOS, Windows, and Linux.

---

## 1. Web App Manifest (`client/public/manifest.json`)

The web app manifest defines:
- **Application Name**: `SyncPlay — Watch together. Talk together. Anywhere.`
- **Short Name**: `SyncPlay`
- **Display**: `standalone` (removes browser URL bar and navigation buttons for an immersive fullscreen watch experience)
- **Background Color**: `#0B0B12`
- **Theme Color**: `#0B0B12`
- **Responsive Icon Set**:
  - `icon-192.png` (192x192 PNG with `maskable` support)
  - `icon-512.png` (512x512 PNG with `maskable` support)
  - `icon.svg` (Scalable vector icon)

---

## 2. Service Worker (`client/public/sw.js`)

The service worker implements multi-tier caching and intelligent stream bypassing:

### Caching Strategy
1. **Pre-Cached App Shell**:
   - `/`, `/offline.html`, `/manifest.json`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon.svg`
2. **Network-First Navigation**:
   - For all HTML document navigation requests, the service worker attempts to load fresh content over the network. If the user is offline or disconnected, it serves the cached page or falls back to `/offline.html`.
3. **Stale-While-Revalidate for Static Assets**:
   - Bundled JavaScript, CSS stylesheets, and web fonts are served from cache immediately while updating in the background.

### Critical Stream Bypassing Rules
To guarantee real-time synchronization, WebRTC signaling, and low-latency video streaming, the service worker explicitly bypasses:
- **WebSocket & Socket.IO**: Requests beginning with `/socket.io/*` or using `ws:` / `wss:` protocols.
- **REST APIs**: Requests to `/api/*`.
- **External Video Providers**: Domains belonging to `youtube.com`, `googlevideo.com`, `ytimg.com`.
- **Media Buffers**: Requests with `destination === 'video'` or `destination === 'audio'`, or streaming binary blobs.

---

## 3. Offline Experience (`client/public/offline.html`)

When a user loses network connectivity, SyncPlay displays a dark-first offline screen:
- Matches SyncPlay brand styling (`#0B0B12`, purple gradients, clean typography).
- Informs the user that real-time video synchronization and WebRTC require internet access.
- Provides a one-click **"Check Connection & Retry"** button.
