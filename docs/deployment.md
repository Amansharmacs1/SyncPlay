# Production Deployment & TURN Server Configuration

SyncPlay is engineered for production deployment across modern cloud platforms:

- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend**: Render, Railway, or Fly.io
- **Database**: MongoDB Atlas
- **TURN Relay**: Coturn, Metered, Twilio, or Xirsys

---

## 1. Environment Configuration

### Client (`client/.env.production`)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

### Server (`server/.env.production`)
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/syncplay?retryWrites=true&w=majority

# WebRTC STUN & TURN Configuration
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_URL=turn:turn.yourdomain.com:3478?transport=udp,turn:turn.yourdomain.com:3478?transport=tcp,turns:turn.yourdomain.com:5349?transport=tcp
TURN_USERNAME=syncplay_turn_user
TURN_CREDENTIAL=your_secure_turn_password

# Mesh Call Participant Limit
MAX_CALL_PARTICIPANTS=8
```

---

## 2. STUN vs. TURN in WebRTC

```
+-------------------+                          +-------------------+
|     Client A      |                          |     Client B      |
|  (Home Wi-Fi NAT) |                          | (Cellular 5G NAT) |
+---------+---------+                          +---------+---------+
          |                                              |
          |               1. STUN Discovery              |
          +------------> [Public STUN Server] <----------+
          |         (Discovers Public IP & Port)         |
          |                                              |
          v                                              v
      [Direct P2P UDP Connection Established (80% of Cases)]
                                 OR
          +----------------------------------------------+
          | If Symmetric NAT blocks direct connection:   |
          |      2. TURN Relay Server Traversal          |
          |           [Coturn / Cloud TURN]              |
          +----------------------------------------------+
```

1. **STUN (Session Traversal Utilities for NAT)**:
   - Used for discovery of public IP addresses and ports.
   - SyncPlay queries Google's public STUN pool by default.
2. **TURN (Traversal Using Relays around NAT)**:
   - Required when firewalls or Symmetric NATs prevent direct P2P connections (typically ~15-20% of enterprise/cellular connections).
   - In SyncPlay, TURN credentials are kept securely on the backend server and delivered dynamically to authorized clients via `/api/webrtc/ice-servers`. Secrets are never hardcoded into client source files.

---

## 3. Deployment Steps

### Deploying the Backend (e.g. Render / Railway)
1. Link your Git repository.
2. Set Root Directory to `server`.
3. Set Build Command: `npm install && npm run build`.
4. Set Start Command: `npm run start`.
5. Add the environment variables from `server/.env.production`.

### Deploying the Frontend (e.g. Vercel)
1. Link your Git repository.
2. Set Root Directory to `client`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add `VITE_API_URL` and `VITE_SOCKET_URL` environment variables pointing to your deployed backend.
