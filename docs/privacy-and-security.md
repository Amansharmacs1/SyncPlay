# Privacy & Security Architecture — SyncPlay

SyncPlay is architected with privacy by design. We believe that social entertainment platforms should not require user surveillance, tracking cookies, or credential databases.

---

## 1. Zero-Login Architecture

SyncPlay operates completely free of user accounts:
- **No Passwords to Leak**: Users never provide passwords, emails, or phone numbers.
- **No OAuth Profiling**: SyncPlay does not use Google, Facebook, Apple, or GitHub tracking scripts or identity tokens.
- **No Third-Party Analytics / Tracking**: No tracking cookies, advertising IDs, or telemetry beacons.
- **Guest Identity Lifecycle**: Guest session IDs (`user_<hex>`) exist only in client browser `localStorage` and memory for the duration needed to maintain room presence and reconnect after intermittent drops.

---

## 2. Room Privacy Controls

- **Cryptographic Room IDs**: 6-character uppercase alphanumeric room codes generated with high collision resistance (`nanoid` custom alphabet).
- **Optional Room Passwords**: Hosts can set a room password at creation or via room settings. Passwords are salted and hashed using `bcrypt` (10 rounds) before storage. Raw passwords are never transmitted or stored in plain text.
- **Room Locking**: Hosts can lock rooms dynamically to prevent unexpected joiners once the group is assembled.
- **Direct P2P Media Streams**: WebRTC audio and video streams flow directly peer-to-peer between participants without passing through or being recorded by SyncPlay servers.
- **CORS & Sandbox Enforcement**: Cross-Origin Resource Sharing (CORS) rules and content security limits restrict media loading to authorized and safe origins.
