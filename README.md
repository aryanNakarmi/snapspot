# SnapSpot - QR-Based Event Photo Sharing

**Share event photos in real-time with QR codes. No app downloads, no logins for guests.**

## Problem

At events like weddings, parties, and college programs:

- Photos are scattered across different phones
- People share through WhatsApp later (if they remember)
- Organizers struggle to collect all memories in one place

## Solution

SnapSpot makes event photo sharing effortless:

1. **Organizer creates event** → Gets unique QR code
2. **Guest scans QR** → Instantly joins event (no login!)
3. **Guest takes photo** → Uploads directly from browser
4. **Photos appear instantly** → Everyone sees them in real-time

## Features

- **QR Code Access** - Guests scan and join instantly
- **Real-time Gallery** - Photos appear live as they're uploaded
- **Camera Integration** - Direct photo capture from mobile browsers
- **No Downloads** - Works in any web browser
- **Responsive Design** - Perfect on phones, tablets, desktops
- **Event Management** - Organizers can view, edit, delete events
- **Photo Management** - Download or delete photos
- **Automatic QR Codes** - Generated for every event
- **AI Content Moderation** - NSFW/violence filtering (Hugging Face + Google Vision)
- **Smart Photo Grouping** - Photos auto-grouped by face, object labels, and time
- **"Find Me" Face Search** - Guests upload a selfie and instantly find every photo they appear in — 100% on-device, the selfie is never uploaded
- **Comic Book View** - Turn the gallery into an interactive comic book
- **Offline Upload Queue** - Photos taken offline upload automatically when back online (PWA)

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Auth:** Firebase Authentication
- **Database:** Firestore (Real-time)
- **Storage:** Cloudinary (Images)
- **AI:** Hugging Face Inference API, Google Cloud Vision, face-api.js (on-device)
- **PWA:** Service worker + IndexedDB offline queue
- **Hosting:** Vercel (Recommended)
- **QR Codes:** qrcode.js

## Getting Started

### 1. Prerequisites

- Node.js 18+ and npm
- A [Firebase](https://console.firebase.google.com) project (Authentication + Firestore enabled)
- A [Cloudinary](https://cloudinary.com) account

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Firebase and Cloudinary values (see comments in `.env.example`).

Optional but recommended:

- `HF_TOKEN` (free from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)) — enables NSFW moderation + object labels
- `GOOGLE_VISION_API_KEY` — enables stronger moderation (SafeSearch)

### 4. Deploy Firestore security rules

**Important:** Firestore is wide open by default. Deploy the included rules:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project, use the existing firestore.rules
firebase deploy --only firestore:rules
```

The rules allow:

- Anyone to **read** events/photos (guests join via QR code, no login)
- Anyone to **add** a photo to an event
- Only the signed-in **organizer** to edit/delete their events and photos

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Start the dev server           |
| `npm run build`  | Production build               |
| `npm run start`  | Start the production server    |
| `npm run lint`   | Run ESLint                     |

## Project Structure

```
app/
  api/                 # Server routes (moderation, object analysis, photo deletion)
  auth/                # Sign in / sign up
  event/[code]/        # Guest page (upload + gallery + Find Me + comic view)
  organizer/           # Organizer create / dashboard / event management
components/            # Camera, gallery, comic view, Find Me modal, PWA bits
lib/                   # Firebase, services, face recognition, grouping, offline queue
public/models/         # face-api.js model files (served statically)
firestore.rules        # Firestore security rules (deploy before going live)
```

## Security Notes

- **Firestore rules** are required before public deployment — deploy `firestore.rules` (see step 4 above).
- **API routes** (`/api/moderate`, `/api/analyze`) only accept image URLs from `res.cloudinary.com` to prevent SSRF abuse.
- **Secrets** (`CLOUDINARY_API_SECRET`, `HF_TOKEN`, `GOOGLE_VISION_API_KEY`) are server-only — never expose them in `NEXT_PUBLIC_` variables.
- **"Find Me"** runs entirely in the browser — the selfie is analyzed on-device and never uploaded.
- Known limitation: `/api/delete-photo` (Cloudinary asset deletion) is unauthenticated. Public IDs are unguessable UUIDs, which limits abuse, but a production deployment should add Firebase ID-token verification (e.g. via `firebase-admin`) before exposing it publicly.

## License

Private project — © SnapSpot.
