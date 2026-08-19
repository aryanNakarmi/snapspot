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
