# WebRTC & Real-Time Troubleshooting Guide

This guide assists in diagnosing common audio, video, networking, and synchronization issues in SyncPlay.

---

## 1. Remote Video Shows Black Screen or Spinner

### Symptom:
A peer joins the call, but their video tile displays a black frame or continuous loading spinner.

### Potential Causes & Fixes:
1. **Camera Disabled on Peer's Side**:
   - Verify if the peer's camera is toggled off (`cameraEnabled: false`). SyncPlay displays their avatar and initials when the camera is disabled.
2. **Autoplay Policy Blocking Video/Audio**:
   - Modern browsers (especially Safari and iOS) restrict unmuted audio and video playback without an initial user gesture. SyncPlay attaches `muted` to local previews and auto-starts remote streams on user interaction.
3. **NAT / Firewall Traversal Failure**:
   - If peers cannot exchange packets directly due to Symmetric NAT or enterprise firewalls, a TURN relay server is required. Verify `TURN_URL` in `.env`.

---

## 2. Echo or Audio Feedback

### Symptom:
Users hear an echo of their own voice when speaking.

### Causes & Fixes:
1. **Local Preview Unmuted**:
   - The local `<video>` preview tag must always remain `muted`. SyncPlay enforces `muted={participant.isLocal}` on all video components.
2. **Missing Acoustic Echo Cancellation (AEC)**:
   - SyncPlay enforces `echoCancellation: true`, `noiseSuppression: true`, and `autoGainControl: true` in media constraints.
   - Recommend headphones if a participant is using external desktop speakers with high volume.

---

## 3. Screen Sharing Fails or Button Disabled

### Symptom:
User clicks "Share Screen" and receives an error, or the feature is unavailable.

### Causes & Fixes:
1. **Mobile Browser Limitation**:
   - iOS Safari and Android Chrome currently do not support `navigator.mediaDevices.getDisplayMedia()` on handheld mobile devices due to OS-level sandboxing. SyncPlay displays an informative toast rather than crashing.
2. **User Cancelled Window Selection**:
   - If the user cancels the browser's system window picker, `NotAllowedError` is caught gracefully without interrupting ongoing audio or video.

---

## 4. Connection Quality Shows "Poor" or "Reconnecting"

### Symptom:
The connection indicator on a participant's tile turns orange or red.

### Causes & Fixes:
1. **High Packet Loss or Latency**:
   - The stats engine monitors Round-Trip Time (RTT) and packet loss via `pc.getStats()`.
   - If RTT exceeds 300ms or packet loss exceeds 8%, the indicator switches to `poor`.
2. **Quality Preset Optimization**:
   - Open Device Settings (gear icon in toolbar) and switch to the **"Low Bandwidth"** preset (`320x240, 15fps, 150kbps`) to reduce network congestion.
