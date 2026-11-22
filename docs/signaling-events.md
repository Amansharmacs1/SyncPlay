# Socket.IO Signaling Events Reference

SyncPlay uses Socket.IO as the signaling plane for WebRTC session negotiation and media status synchronization. The signaling server verifies room authorization and forwards payloads directly between authorized peers.

---

## 1. Client to Server Events

### `webrtc:join`
Sent when a participant clicks to join the voice/video call.
- **Payload**:
  ```typescript
  {
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
  }
  ```
- **Server Action**: Adds user to room's active call list, notifies caller of existing call participants, and broadcasts to peers.

### `webrtc:leave`
Sent when a participant leaves the call (without leaving the watch room).
- **Payload**: None
- **Server Action**: Removes caller from call registry and emits `webrtc:participant-left` to all other call peers.

### `webrtc:offer`
Transmits an SDP Offer to a specific peer.
- **Payload**:
  ```typescript
  {
    targetParticipantId: string;
    offer: {
      type: 'offer';
      sdp: string;
    };
  }
  ```

### `webrtc:answer`
Transmits an SDP Answer in response to an offer.
- **Payload**:
  ```typescript
  {
    targetParticipantId: string;
    answer: {
      type: 'answer';
      sdp: string;
    };
  }
  ```

### `webrtc:ice-candidate`
Relays an ICE candidate to a specific peer.
- **Payload**:
  ```typescript
  {
    targetParticipantId: string;
    candidate: {
      candidate: string;
      sdpMid?: string | null;
      sdpMLineIndex?: number | null;
      usernameFragment?: string | null;
    };
  }
  ```

### `media:camera-status`
Updates camera state (enabled / disabled).
- **Payload**: `{ enabled: boolean }`

### `media:microphone-status`
Updates microphone state (muted / unmuted).
- **Payload**: `{ enabled: boolean }`

### `media:screen-share-status`
Updates screen sharing state (active / inactive).
- **Payload**: `{ sharing: boolean }`

### `media:connection-quality`
Reports peer-evaluated network quality.
- **Payload**: `{ quality: 'excellent' | 'good' | 'poor' | 'reconnecting' }`

---

## 2. Server to Client Events

### `webrtc:call-participants`
Delivered to a joining participant with the list of current peers in the call.
- **Payload**:
  ```typescript
  {
    participants: Array<{
      participantId: string;
      name: string;
      cameraEnabled: boolean;
      microphoneEnabled: boolean;
      screenSharing: boolean;
      connectionQuality?: 'excellent' | 'good' | 'poor' | 'reconnecting';
    }>;
  }
  ```

### `webrtc:participant-joined`
Broadcast to existing call members when a new peer joins the call.
- **Payload**:
  ```typescript
  {
    participantId: string;
    name: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
  }
  ```

### `webrtc:participant-left`
Broadcast to call members when a peer leaves the call or disconnects.
- **Payload**: `{ participantId: string }`

### `webrtc:offer`
Relayed SDP offer from a peer.
- **Payload**:
  ```typescript
  {
    fromParticipantId: string;
    offer: { type: 'offer'; sdp: string };
  }
  ```

### `webrtc:answer`
Relayed SDP answer from a peer.
- **Payload**:
  ```typescript
  {
    fromParticipantId: string;
    answer: { type: 'answer'; sdp: string };
  }
  ```

### `webrtc:ice-candidate`
Relayed ICE candidate from a peer.
- **Payload**:
  ```typescript
  {
    fromParticipantId: string;
    candidate: RTCIceCandidateInit;
  }
  ```

### `media:participant-status`
Broadcast when any participant modifies their camera, mic, or screen sharing status.
- **Payload**:
  ```typescript
  {
    participantId: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenSharing: boolean;
    connectionQuality?: 'excellent' | 'good' | 'poor' | 'reconnecting';
  }
  ```
