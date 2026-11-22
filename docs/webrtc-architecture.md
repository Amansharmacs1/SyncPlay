# WebRTC Architecture & Mesh Topology

SyncPlay Phase 2 implements a peer-to-peer (P2P) Full Mesh WebRTC topology for low-latency audio, video, and screen sharing among room participants.

## Mesh Topology Overview

In a mesh topology, each participant in a call establishes a direct bidirectional `RTCPeerConnection` with every other participant in the same call.

For $N$ participants in a call:
$$\text{Total Peer Connections} = \frac{N(N - 1)}{2}$$

Each client maintains $(N - 1)$ upstream connections and $(N - 1)$ downstream connections.

```
                   [Client A]
                  /          \
            (P2P)/            \(P2P)
                /              \
         [Client B]-----------[Client C]
                       (P2P)
```

### Trade-Offs and Capacity Limits
- **Latency**: True peer-to-peer latency without an intermediate media server hop.
- **Bandwidth & CPU**: CPU and uplink bandwidth requirements scale linearly with participant count.
- **Capacity**: Configured by default to a maximum of 8 participants per call (`MAX_CALL_PARTICIPANTS=8`).
- **Future SFU Migration**: The modular separation of `SignalingService`, `MediaManager`, and `WebRTCManager` ensures that an SFU (Selective Forwarding Unit such as Mediasoup, LiveKit, or Pion) can be introduced in Phase 3 by updating `SignalingService` and `PeerConnection` without modifying the UI components.

---

## Negotiation Protocol (Perfect Negotiation Pattern)

To eliminate glare (when two peers attempt to send an offer to each other simultaneously), SyncPlay implements the standard W3C Perfect Negotiation pattern:

1. **Polite vs. Impolite Peers**:
   - When a new participant joins, existing participants initiate offers (`isPolite = false`).
   - The newly joined participant receives offers and answers them (`isPolite = true`).
2. **Glare Resolution**:
   - If an offer collision occurs on an impolite peer, it ignores the incoming offer and continues with its own.
   - If a collision occurs on a polite peer, it rolls back its local offer (`pc.setLocalDescription({ type: 'rollback' })`) and processes the incoming offer.
3. **Candidate Queuing**:
   - ICE candidates arriving before `setRemoteDescription` is invoked are buffered in an internal queue and drained immediately after `setRemoteDescription` completes.

---

## Media Track Management & Screen Sharing

### Dynamic Track Replacement
When a user begins screen sharing, the outgoing video track is replaced on all active peer connections using:

```typescript
const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
await sender.replaceTrack(screenTrack);
```

Using `replaceTrack()` avoids triggering an expensive SDP renegotiation across all peer connections. When screen sharing ends, `replaceTrack()` restores the camera video track seamlessly.

---

## Voice Activity & Active Speaker Detection

Each stream is analyzed using the browser's Web Audio API:
1. `AudioContext.createMediaStreamSource(stream)` connects to an `AnalyserNode`.
2. Audio frequency data is sampled at 100ms intervals.
3. If normalized volume exceeds `0.15`, the participant is highlighted as an active speaker with an animated glowing border.
