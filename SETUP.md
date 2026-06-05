# 🚀 SnapSpot - Complete Setup Guide

Welcome! This is your complete step-by-step guide to get SnapSpot running.

## What is SnapSpot?

SnapSpot is a QR-based real-time event photo sharing system. Guests scan a QR code, take photos, and share them instantly with everyone at the event!

## 📋 Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- A Cloudinary account (free) 
- A Firebase account (free)
- A text editor (VS Code recommended)

---

## PART 1: Setup Firebase 🔥

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Name it: **"snapspot"**
4. Uncheck "Enable Google Analytics"
5. Click **"Create Project"**
6. Wait for setup to complete, then click **"Continue"**

### Step 2: Enable Firebase Authentication

1. Click **"Authentication"** (left sidebar)
2. Click **"Get started"**
3. Click **"Email/Password"**
4. Toggle **"Enable"**
5. Click **"Save"**

### Step 3: Create Firestore Database

1. Click **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose location: **"asia-south1"** (Mumbai - closest to Nepal)
5. Click **"Enable"**

### Step 4: Get Firebase Config

1. Click the **gear icon** ⚙️ (top left)
2. Click **"Project settings"**
3. Scroll to **"Your apps"**
4. Click the web icon **`</>`**
5. Register: Name it **"SnapSpot Web"**
6. Copy the config object

**You'll see something like:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDRlrUVXSkbjUxNwbDBvuAlzaMdWlF91AE",
  authDomain: "snapshot-3d27a.firebaseapp.com",
  projectId: "snapshot-3d27a",
  storageBucket: "snapshot-3d27a.firebasestorage.app",
  messagingSenderId: "143634114461",
  appId: "1:143634114461:web:be3236007ede4c976e7174"
};
```

### Step 5: Add Firestore Security Rules

1. Go to **"Firestore Database"**
2. Click **"Rules"** tab
3. **Delete all existing code**
4. Paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events: organizers can CRUD their own, anyone can read
    match /events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.organizerId == request.auth.uid;
    }
    
    // Photos: anyone can create, organizer can delete
    match /events/{eventId}/photos/{photoId} {
      allow read: if true;
      allow create: if true;
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/events/$(eventId)).data.organizerId == request.auth.uid;
    }
  }
}
```

5. Click **"Publish"**

---

## PART 2: Setup Cloudinary ☁️

### Step 1: Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Click **"Sign up for free"**
3. Sign up with email/password
4. Verify your email
5. Log in

### Step 2: Get Your API Credentials

1. Go to **Cloudinary Dashboard**
2. Click **"Settings"** (gear icon, bottom left)
3. Click **"API Keys"** tab
4. Copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (keep this secret!)

### Step 3: Create Upload Preset

1. In Cloudinary Dashboard, click **"Upload"** (left sidebar)
2. Click **"Upload Presets"** tab
3. Click **"Create upload preset"**
4. Set:
   - Name: **`snapspot_uploads`**
   - Unsigned: **ON**
   - Folder: **`snapspot/events`**
5. Click **"Save"**

**Important:** Keep the **unsigned** setting ON so guests can upload without authentication!

---

## PART 3: Setup Your Local Project 💻

### Step 1: Extract Project

Extract the snapspot.zip file to a folder.

### Step 2: Install Dependencies

Open terminal/command prompt in the snapspot folder and run:

```bash
npm install
```

This installs all required packages (~2-3 minutes).

### Step 3: Create .env.local File

In the snapspot folder, create a file called `.env.local` (copy from `.env.example`)

Fill it with your credentials:

```dotenv
# Firebase Configuration (from Step 1)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDRlrUVXSkbjUxNwbDBvuAlzaMdWlF91AE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=snapshot-3d27a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=snapshot-3d27a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=snapshot-3d27a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=143634114461
NEXT_PUBLIC_FIREBASE_APP_ID=1:143634114461:web:be3236007ede4c976e7174

# Cloudinary Configuration (from Step 2)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Replace with YOUR actual values!**

### Step 4: Run the App

```bash
npm run dev
```

Open: http://localhost:3000

🎉 **You should see the SnapSpot homepage!**

---

## PART 4: Test the App 🧪

### Test Organizer Flow

1. Go to http://localhost:3000
2. Click **"Create Event"** or **"Sign In"**
3. Sign up with an email (any email works)
4. Create an event
5. See the QR code and event code
6. Click **"View Event"**

### Test Guest Flow

1. On the organizer dashboard, find your event
2. Copy the **Event Code** (e.g., ABC123)
3. Open http://localhost:3000/event/ABC123
4. Click **"Take Photo"**
5. Select/take a photo
6. Click **"Upload"**
7. Watch it appear in the gallery instantly! ✨

---

## 📁 Project Structure

```
snapspot/
├── app/
│   ├── page.tsx                 # Homepage
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── auth/
│   │   ├── signin/page.tsx      # Sign in page
│   │   └── signup/page.tsx      # Sign up page
│   ├── organizer/
│   │   ├── create/page.tsx      # Create event
│   │   └── event/[eventId]/page.tsx  # Organizer dashboard
│   ├── event/
│   │   └── [code]/page.tsx      # Guest event page
│   ├── api/
│   │   └── delete-photo/route.ts  # Delete photo endpoint
├── components/
│   ├── AuthForm.tsx             # Auth form
│   ├── CameraCapture.tsx        # Photo upload
│   └── PhotoGallery.tsx         # Photo gallery
├── lib/
│   ├── firebase.ts              # Firebase config
│   ├── authContext.tsx          # Auth state
│   ├── eventService.ts          # Firestore operations
│   ├── cloudinaryService.ts     # Cloudinary operations
│   └── qrGenerator.ts           # QR code generation
├── .env.example                 # Environment template
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 🎯 Features Included

✅ **Organizer Authentication** - Sign up/sign in
✅ **Event Creation** - Create events with names & descriptions
✅ **QR Code Generation** - Auto-generated QR codes
✅ **Guest Photo Upload** - Camera or file upload
✅ **Real-time Gallery** - Photos appear instantly
✅ **Event Management** - View, edit, delete events
✅ **Photo Management** - Organizers can delete photos
✅ **Responsive Design** - Works on mobile & desktop

---

## 🚀 Deployment (Optional)

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click **"New Project"**
4. Import your GitHub repo
5. Add environment variables:
   - Go to **Settings → Environment Variables**
   - Add all variables from `.env.local`
6. Click **"Deploy"**

**Done!** Your app is live on the internet!

---

## 🔐 Security Notes

- Firestore Rules prevent unauthorized access
- Event photos are public (by design - for guests)
- Only organizers can delete photos
- Upload presets are unsigned (safe for guests)

---

## 🐛 Troubleshooting

### "Cannot find module 'firebase'"
```bash
npm install
```

### "NEXT_PUBLIC_FIREBASE_API_KEY is undefined"
- Check `.env.local` file exists
- Restart dev server: `npm run dev`

### "Cloudinary upload fails"
- Check upload preset is **unsigned**
- Check Cloud Name in `.env.local`
- Restart dev server

### "Photos don't appear"
- Check Firestore Rules are published
- Check Cloudinary credentials
- Check browser console for errors

---

## 📚 Useful Links

- [Firebase Docs](https://firebase.google.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)

---

## 💡 Next Steps

1. **Customize branding** - Change colors, logo, name
2. **Add more features** - Photo filters, comments, sharing
3. **Improve mobile UX** - Responsive design tweaks
4. **Add analytics** - Track upload counts, user engagement
5. **Deploy live** - Make it available on the internet

---

## 🤝 Support

If you get stuck:
1. Check the troubleshooting section above
2. Check browser console for errors (F12)
3. Check `.env.local` file is correct
4. Restart the dev server

---

Built with ❤️ for making event memories easier to share!
