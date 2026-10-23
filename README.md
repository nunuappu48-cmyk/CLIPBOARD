# QuickClip — Real-Time Text & Image Sharing App

QuickClip is a lightning-fast, real-time shared clipboard that allows friends and colleagues to share text, code snippets, screenshots, and images instantaneously across devices through a single secure room link — with zero account registration required.

Built with **React**, **Vite**, **Tailwind CSS**, and powered by **Supabase** (PostgreSQL, Realtime, and Storage).

---

## Features

- **Instant Ephemeral Rooms**: Generate a unique room in 1-click protected by cryptographically random tokens (SHA-256 hashed on the backend).
- **Sub-100ms Real-Time Text Editor**:
  - Live typing synchronization without page refreshes.
  - Automatic debounce (400 ms) before database persistence.
  - Character counter with a 50,000 character limit.
  - Loop and echo prevention with participant session tracking.
  - Monospace (code) vs. Sans (plain text) view toggle.
  - "Copy Text" and "Clear Text" with confirmation dialog.
- **Image & Screenshot Sharing**:
  - Drag & drop images into the room.
  - Direct clipboard screenshot pasting with <kbd>Ctrl+V</kbd>.
  - Multiple image upload with live progress bars.
  - Responsive image gallery with hover actions.
  - Full-screen lightbox preview with download and link copy.
  - Formats supported: PNG, JPG, JPEG, GIF, WebP (up to 10 MB per image).
- **Production-Minded Security**:
  - PostgreSQL Row Level Security (RLS) on all tables.
  - Private Supabase Storage bucket (`quickclip-images`).
  - Short-lived signed URLs for image previews.
  - Security Definer RPC functions with cryptographic token verification.
  - No service-role keys exposed in frontend code.
- **24-Hour Expiration & Cleanup**:
  - Rooms automatically expire 24 hours after their last activity.
  - Visual countdown indicator with warning alert when expiring soon.
  - Server-side cleanup procedure for expired rooms and orphaned files.
- **Local Sandbox & Zero-Friction Preview**:
  - Works out of the box with multi-tab real-time sync even before connecting a Supabase project!
  - In-app Supabase configuration modal allows testing or entering credentials on the fly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite |
| **Styling** | Tailwind CSS v4 |
| **Routing** | React Router v7 |
| **Icons** | Lucide React |
| **Backend & Database** | Supabase (PostgreSQL) |
| **Realtime Sync** | Supabase Realtime (Channels, Broadcast, Postgres Changes) |
| **Image Storage** | Supabase Storage (Private bucket `quickclip-images`) |
| **Deployment Target** | Vercel |

---

## Project Structure

```
CLIPBOARD/
├── public/
│   └── favicon.svg             # QuickClip icon
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top navigation with room pills & settings
│   │   ├── ConnectionStatus.jsx# Live sync indicator (connected/connecting/disconnected)
│   │   ├── ShareRoomLink.jsx   # Shareable URL with copy & native share
│   │   ├── TextClipboard.jsx   # Real-time text editor with character counter
│   │   ├── ImageUploader.jsx   # Drag & drop upload zone & progress bars
│   │   ├── ImageGallery.jsx    # Responsive image grid with hover actions
│   │   ├── ImageLightbox.jsx   # Fullscreen modal preview with download/copy
│   │   ├── ConfirmDialog.jsx   # Accessible confirmation modal
│   │   ├── ConfigModal.jsx     # In-app Supabase connection modal
│   │   └── Toast.jsx           # Global floating notification toasts
│   ├── hooks/
│   │   ├── useRoom.js          # Room verification, metadata & countdown
│   │   ├── useRealtimeText.js  # Debounced text sync & broadcast hook
│   │   └── useRoomImages.js    # Image uploads, gallery & Ctrl+V paste hook
│   ├── lib/
│   │   ├── crypto.js           # Web Crypto API token generation & SHA-256
│   │   ├── validation.js       # File format & size validation
│   │   ├── supabase.js         # Supabase client & unified API
│   │   └── mockBackend.js      # Local multi-tab BroadcastChannel fallback
│   ├── pages/
│   │   ├── Home.jsx            # Landing page (Create Room, Join Room, How it works)
│   │   ├── Room.jsx            # Main collaborative room page
│   │   └── NotFound.jsx        # 404 handler
│   ├── App.jsx                 # Router & Toast provider
│   ├── main.jsx                # Application root
│   └── index.css               # Tailwind & typography configuration
├── supabase/
│   ├── migrations/
│   │   └── 20261023000000_init_quickclip.sql # Schema & RLS migration
│   ├── setup.sql               # Single-click setup script for Supabase SQL Editor
│   └── functions/
│       └── cleanup-expired-rooms/
│           └── index.ts        # Scheduled cleanup Edge Function
├── .env.example                # Sample environment variables
├── package.json
├── vite.config.js
└── README.md
```

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18+ (Node v20 or v24 recommended)
- npm or pnpm

### 2. Installation

```bash
# Clone or navigate to the project directory
cd CLIPBOARD

# Install dependencies
npm install
```

### 3. Setting Up Supabase

#### Step A: Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com/) and click **New Project**.
2. Name your project (e.g., `quickclip`) and choose a database password and region.

#### Step B: Run the Database Setup Script
1. In your Supabase Dashboard, open the **SQL Editor** from the left sidebar.
2. Click **New Query**.
3. Copy the contents of [`supabase/setup.sql`](./supabase/setup.sql) and paste them into the query editor.
4. Click **Run**. This will automatically:
   - Create `rooms`, `room_content`, and `room_images` tables.
   - Configure Row Level Security (RLS) policies.
   - Set up the private `quickclip-images` storage bucket.
   - Enable Realtime replication for `room_content` and `room_images`.
   - Install the secure RPC functions (`create_quickclip_room`, `verify_and_get_room`, `update_room_text`, etc.).

#### Step C: Enable Realtime in Supabase
The script automatically configures replication, but verify in your Supabase Dashboard:
1. Go to **Database** -> **Replication**.
2. Verify that `supabase_realtime` has `room_content` and `room_images` toggled **ON**.

#### Step D: Set Environment Variables
1. In your Supabase Dashboard, go to **Project Settings** -> **API**.
2. Copy your **Project URL** and **Project API Key (`anon` / `public`)**.
3. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

4. Populate your `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Tip**: You can test real-time synchronization locally by opening two separate browser windows (or one normal window and one incognito window) with the same room link. Changes will sync live!

---

## Room Expiration and Automated Cleanup

Rooms are configured to expire **24 hours** after their last activity. Every meaningful activity (typing text, uploading an image, clearing text) refreshes the `last_activity_at` and extends `expires_at`.

### Triggering Automated Cleanup:
You can schedule the database cleanup procedure in two ways:

#### Option 1: Via Supabase pg_cron (Recommended)
If your Supabase project has `pg_cron` enabled, run this in the SQL Editor:
```sql
select cron.schedule(
  'cleanup-quickclip-rooms',
  '0 * * * *', -- Runs every hour
  $$select public.cleanup_expired_rooms();$$
);
```

#### Option 2: Via Supabase Edge Function
Deploy the provided function in `supabase/functions/cleanup-expired-rooms`:
```bash
supabase functions deploy cleanup-expired-rooms
```
You can invoke this URL with a cron job from Vercel Cron or GitHub Actions.

---

## Production Deployment to Vercel

### Step 1: Push Code to GitHub / Git Provider
```bash
git add .
git commit -m "Initial QuickClip release"
git push origin main
```

### Step 2: Import Project to Vercel
1. Log in to [vercel.com](https://vercel.com/) and click **Add New** -> **Project**.
2. Select your repository.
3. Framework Preset: **Vite**.
4. Root Directory: `./`.

### Step 3: Add Environment Variables in Vercel
Under **Environment Variables**, add:
- `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### Step 4: Configure SPA Client-Side Routing
QuickClip uses React Router. To ensure deep links like `/room/:roomId` resolve correctly on Vercel without 404 errors, create a `vercel.json` file (included in the repository):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Step 5: Click Deploy
Vercel will build and deploy QuickClip with automatic SSL and global CDN distribution.

---

## Verification & Testing Scenarios

1. **Room Creation & URL Generation**:
   - Click "Create New Room" on the home page.
   - Verify that the URL changes to `/room/<uuid>#token=<token>`.
2. **Copy Room Link**:
   - Click "Copy Link". Verify that the confirmation toast appears and the URL in the clipboard matches the browser URL.
3. **Multi-Browser Sync (Text)**:
   - Open the link in a second browser window or private window.
   - Type text in Window A. Verify that Window B updates in real time without refreshing.
   - Verify that character counter updates and save status transitions from "Saving..." to "Saved".
4. **Image Upload & Real-Time Gallery**:
   - Drag and drop or browse an image (< 10 MB) into the upload area.
   - Verify upload progress bar displays.
   - Verify the thumbnail appears immediately in both Window A and Window B.
5. **Screenshot Paste (Ctrl+V)**:
   - Capture a screenshot (e.g. `Win+Shift+S` on Windows or `Cmd+Shift+4` on Mac).
   - Press `Ctrl+V` anywhere inside the room. Verify that the screenshot is uploaded automatically.
6. **Lightbox & Download**:
   - Click an image card to open the fullscreen lightbox.
   - Click "Download Image" to verify the file downloads correctly.
   - Click "Copy Image Link" to copy the signed URL.
7. **Clear Text**:
   - Click "Clear" in the editor.
   - Verify confirmation modal prevents accidental deletion.
   - Confirm clear and verify editor empties in both windows.
8. **Delete Image**:
   - Hover over an image card and click the trash icon.
   - Confirm deletion. Verify the image is removed from both Window A and Window B.
9. **Expired Room Protection**:
   - Attempting to access an expired room renders the "Room Has Expired" screen with a quick action to create a new room.
10. **Unauthorized Access Protection**:
   - Removing the `#token=...` from the URL displays "Access Denied" or "Missing Token", preventing unauthorized access.

---

## Security Model Summary

- **Cryptographic Access Tokens**: Room URLs carry a 256-bit cryptographically secure token (`crypto.getRandomValues`). The raw token is hashed (`SHA-256`) before being stored or checked in PostgreSQL.
- **URL Hash Fragments**: Tokens are stored in the URL hash (`#token=...`). Browsers never transmit URL hash fragments in HTTP request headers or server access logs.
- **Row Level Security (RLS)**: Public tables reject unauthenticated direct queries; all operations route through `SECURITY DEFINER` RPC routines that validate the token hash and room expiration timestamp.
- **Private Storage**: Room images reside in a private bucket accessible only via short-lived signed URLs.

---

## License

MIT License. Free for personal and commercial use.
