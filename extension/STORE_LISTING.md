# OpenLoom — Chrome Web Store Listing

All text assets needed for Chrome Web Store submission.

---

## Store Name

**OpenLoom**

## Category

**Productivity**

## Language

**English**

---

## Store Description

```
OpenLoom is a free, open-source screen recorder that lets you capture your screen with an optional camera overlay and share recordings through your own backend — no third-party servers, no subscriptions, full ownership of your data.

HOW IT WORKS

1. Pick your backend — Connect your own Firebase, Supabase, or Convex project. OpenLoom auto-deploys the required cloud functions during setup.
2. Record — Capture your entire screen, a specific window, or a browser tab. Optionally add a picture-in-picture camera overlay and microphone audio.
3. Share — Get a shareable link instantly after upload. Recipients watch in a lightweight web player at openloom.live — no sign-in required.

KEY FEATURES

• Screen + Camera PiP — Record your screen with a draggable camera bubble composited via canvas, not a floating window.
• System + Mic Audio — Mix system audio and microphone input into a single recording.
• Self-Hosted Storage — Videos go to YOUR Firebase, Supabase, or Convex project. No data passes through OpenLoom servers.
• Auto-Provisioning — The setup wizard deploys Cloud Functions or Edge Functions to your project automatically.
• Password Protection — Protect shared links with a password. Encryption is AES-256-GCM, performed client-side.
• Emoji Reactions — Viewers can leave timestamped emoji reactions on your recordings.
• VP8/VP9 WebM Output — Efficient video encoding with broad browser support.
• Open Source — Full source code available on GitHub. Audit every network request.

PRIVACY FIRST

OpenLoom has no accounts, no analytics, no telemetry, and no ads. Your recordings go directly from your browser to your own infrastructure. The shareable web player is a static site — it fetches videos from your backend and has no server-side code.

PERMISSIONS

OpenLoom requests only the permissions needed for screen recording:
• Side panel for the recording UI
• Offscreen document for media capture
• Storage for your settings
• Unlimited storage for video blobs in IndexedDB
• Alarms to keep the service worker alive during recording

Host permissions for your chosen backend provider are requested only when you set up that provider.

OpenLoom is free, open source, and always will be.
```

---

## Single Purpose Statement

> Record your screen with an optional camera overlay and share recordings through self-hosted backend infrastructure.

---

## Permission Justifications

### sidePanel
The extension's entire user interface — recording controls, video library, and settings — is rendered in Chrome's side panel. This is the primary interaction surface.

### offscreen
Chrome extensions cannot access `getDisplayMedia()` or `MediaRecorder` from a service worker. An offscreen document is created to handle screen capture, camera compositing, audio mixing, and video encoding.

### storage
Stores the user's backend configuration (provider type, project ID, API keys) and recording preferences (video quality, camera position) in `chrome.storage.local`.

### unlimitedStorage
Screen recordings are stored as video blobs in IndexedDB before upload. A typical 5-minute HD recording is 50-150 MB. The default 10 MB storage quota would be exhausted immediately. Unlimited storage allows the extension to hold recordings locally until the user reviews and uploads them.

### alarms
Sets a periodic alarm to keep the service worker alive during active recordings. Without this, Chrome terminates the service worker after ~30 seconds of inactivity, which would interrupt recording coordination between the service worker and offscreen document.

### Host Permissions
Network access to the user's chosen backend provider APIs. The extension supports three self-hosted backend options:

- **Firebase**: `*.googleapis.com`, `*.firebasestorage.app`, `*.appspot.com`, `oauth2.googleapis.com`, `run.googleapis.com`, `serviceusage.googleapis.com`, `cloudfunctions.googleapis.com`, `cloudresourcemanager.googleapis.com` — for Firebase Storage uploads, Cloud Functions deployment, and OAuth authentication.
- **Supabase**: `*.supabase.co`, `api.supabase.com` — for Supabase Storage uploads and Edge Functions deployment.
- **Convex**: `*.convex.cloud`, `*.convex.site` — for Convex file storage and function calls.

These are requested as optional permissions and granted only when the user configures a specific provider during the setup wizard.

---

## Data Usage Disclosure

### What data is collected?
None. OpenLoom does not collect, transmit, or store any user data on its own servers.

### What data is transmitted?
Video recordings are transmitted directly from the user's browser to the backend infrastructure they have configured (their own Firebase, Supabase, or Convex project). No data passes through OpenLoom-operated servers.

### Is data sold to third parties?
No. OpenLoom has no mechanism to access user data and does not sell any data.

### Does the extension use remote code?
No. The extension is fully Manifest V3 compliant and does not load or execute any remote code. All functionality is bundled at build time.

---

## Privacy Policy URL

`https://openloom.live/privacy`

## Homepage URL

`https://openloom.live`

## Support URL

`https://github.com/anenthg/OpenLoom/issues`

---

## Graphic Assets Checklist

| Asset | Dimensions | Status |
|-------|-----------|--------|
| Store icon | 128x128 px | Run `node scripts/generate-icons.js` |
| Screenshots (1-5) | 1280x800 px | Capture manually from the extension |
| Small promo tile | 440x280 px | Create branded image with tagline |
| Marquee promo tile (optional) | 1400x560 px | Create for featured placement |

### Recommended Screenshots
1. **Recording Setup** — Side panel showing screen/camera/mic selection
2. **Active Recording** — Screen being recorded with camera PiP overlay
3. **Review & Upload** — Video preview player before uploading
4. **Video Library** — List of recorded and uploaded videos
5. **Settings / Setup Wizard** — Backend provider configuration

---

## Distribution Settings

- **Visibility**: Public
- **Regions**: All regions
- **Pricing**: Free
