# Camera & Microphone Permission Flow

WebRTC requires explicit user permissions to access local audio and video capture hardware. SyncPlay strictly follows user gesture requirements and modern browser permission guidelines.

---

## 1. Permission Flow Design

```
+-------------------------------------------------------------+
|                     User Enters Room                        |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             User Clicks "Join Call" Toolbar CTA             |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     Pre-Join Modal Opens                    |
| - Live device preview (camera viewport & mic level meter)   |
| - Option A: "Join with Camera & Microphone"                 |
| - Option B: "Join with Microphone Only"                     |
| - Option C: "Join Without Audio or Video" (Listen-only)     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|     Browser System Permission Prompt Displayed              |
|        (Triggers only upon direct user button click)        |
+------------------------------+------------------------------+
         |                                          |
         v (Granted)                                v (Denied / Error)
+-----------------------+              +------------------------------+
| Connects to Call with |              | Clean Error Toast displayed; |
| selected media tracks |              | user joins in listen-only    |
+-----------------------+              +------------------------------+
```

---

## 2. Handling Specific Browser Errors

| Error Name | Cause | SyncPlay Handling |
| :--- | :--- | :--- |
| `NotAllowedError` | User clicked "Block" or system permissions are denied. | User-friendly alert informing them how to unblock devices; joins in listen-only mode. |
| `NotFoundError` | Camera or microphone hardware missing. | If camera is missing, automatically attempts audio-only fallback without aborting. |
| `NotReadableError` | Hardware in use by another app (e.g. Zoom or FaceTime). | Informs user that the device is locked by another running program. |
| `OverconstrainedError` | Specific resolution or device ID constraint failed. | Automatically retries with standard unconstrained default hardware settings. |

---

## 3. Leak Prevention & Hardware Teardown

To ensure the camera indicator light (green dot) turns off immediately when not in use:
1. When leaving a call (`webrtcManager.leaveCall()`), all audio and video tracks are explicitly stopped:
   ```typescript
   stream.getTracks().forEach(track => track.stop());
   ```
2. When screen sharing ends, the display capture track is stopped and the camera stream is restored.
3. Pre-join preview tracks are cleanly destroyed as soon as the modal is dismissed.
