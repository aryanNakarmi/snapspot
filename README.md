# 📱 SnapSpot - QR-Based Event Photo Sharing

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Firebase](https://img.shields.io/badge/Firebase-Ready-orange)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Integrated-blue)

**Share event photos in real-time with QR codes. No app downloads, no logins for guests.**

## 🎯 Problem

At events like weddings, parties, and college programs:
- 📸 Photos are scattered across different phones
- 😞 People share through WhatsApp later (if they remember)
- 🤷 Organizers struggle to collect all memories in one place

## ✨ Solution

SnapSpot makes event photo sharing effortless:

1. **Organizer creates event** → Gets unique QR code
2. **Guest scans QR** → Instantly joins event (no login!)
3. **Guest takes photo** → Uploads directly from browser
4. **Photos appear instantly** → Everyone sees them in real-time

## 🚀 Features

✅ **QR Code Access** - Guests scan and join instantly
✅ **Real-time Gallery** - Photos appear live as they're uploaded
✅ **Camera Integration** - Direct photo capture from mobile browsers
✅ **No Downloads** - Works in any web browser
✅ **Responsive Design** - Perfect on phones, tablets, desktops
✅ **Event Management** - Organizers can view, edit, delete events
✅ **Photo Management** - Download or delete photos
✅ **Automatic QR Codes** - Generated for every event

## 📋 Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Auth:** Firebase Authentication
- **Database:** Firestore (Real-time)
- **Storage:** Cloudinary (Images)
- **Hosting:** Vercel (Recommended)
- **QR Codes:** qrcode.js

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Firebase Account (free)
- Cloudinary Account (free)

### Installation

```bash
# 1. Extract project
unzip snapspot-full.zip
cd snapspot

# 2. Install dependencies
npm install

# 3. Create .env.local (copy from .env.example)
cp .env.example .env.local

# 4. Fill in your Firebase & Cloudinary credentials

# 5. Run dev server
npm run dev

# 6. Visit http://localhost:3000
```

For detailed setup instructions, see **[SETUP.md](./SETUP.md)**

## 📁 Project Structure

```
snapspot/
├── app/
│   ├── page.tsx                      # Homepage
│   ├── layout.tsx                    # Root layout
│   ├── auth/
│   │   ├── signin/page.tsx          # Sign in page
│   │   └── signup/page.tsx          # Sign up page
│   ├── organizer/
│   │   ├── create/page.tsx          # Create event
│   │   └── event/[eventId]/page.tsx # Organizer dashboard
│   ├── event/
│   │   └── [code]/page.tsx          # Guest event page
│   └── api/
│       └── delete-photo/route.ts    # Photo deletion API
├── components/
│   ├── AuthForm.tsx                 # Authentication form
│   ├── CameraCapture.tsx            # Photo upload component
│   └── PhotoGallery.tsx             # Photo gallery component
├── lib/
│   ├── firebase.ts                  # Firebase config
│   ├── eventService.ts              # Firestore operations
│   ├── cloudinaryService.ts         # Cloudinary operations
│   ├── qrGenerator.ts               # QR code generation
│   └── authContext.tsx              # Auth state management
├── .env.example                     # Environment variables template
├── package.json                     # Dependencies
└── README.md                        # This file
```

## 🔧 Configuration

### 1. Firebase Setup

```
1. Create Firebase project at console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore Database (production mode)
4. Copy config values to .env.local
```

### 2. Cloudinary Setup

```
1. Sign up at cloudinary.com (free)
2. Create upload preset (unsigned)
3. Get Cloud Name and API Key
4. Add to .env.local
```

### 3. Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📖 Usage

### For Organizers

1. **Sign up** at `/auth/signup`
2. **Create event** at `/organizer/create`
3. **Get QR code** from dashboard
4. **Print or display** QR code at event
5. **View photos** in real-time on dashboard

### For Guests

1. **Scan QR code** with phone camera
2. **Opens event page** automatically
3. **Click "Take Photo"**
4. **Upload photo** from camera or gallery
5. **See all photos** in live gallery instantly

## 🔐 Security

- **Firestore Rules:** Organizers can only edit their own events
- **Photo Access:** Anyone can view/upload (by design)
- **Photo Deletion:** Only organizers can delete photos
- **Upload Preset:** Unsigned (safe for guests)

For full security rules, see **[SETUP.md](./SETUP.md)**

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to vercel.com
# 3. Import your repository
# 4. Add environment variables
# 5. Deploy
```

Your app will be live at a Vercel URL!

## 📱 Mobile Optimization

✅ Mobile-first responsive design
✅ Direct camera access on phones
✅ Optimized for slow connections
✅ Works offline (queues uploads)

## 🎨 Customization

### Change Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    },
  },
}
```

### Change Branding

Edit `app/page.tsx`:
- Replace "SnapSpot" with your name
- Change logo/icon
- Update descriptions

### Add More Features

The codebase is well-organized for additions:
- Add filters in `components/CameraCapture.tsx`
- Add analytics in `lib/eventService.ts`
- Add sharing in `app/event/[code]/page.tsx`

## 🐛 Troubleshooting

### Photos don't upload
- Check Cloudinary credentials in `.env.local`
- Verify upload preset is **unsigned**
- Check browser console for errors

### Real-time updates don't work
- Check Firestore Rules are published
- Check network tab (F12) for Firestore calls
- Restart dev server

### Sign in/up fails
- Check Firebase Auth is enabled
- Check `.env.local` has Firebase keys
- Check browser console for errors

For more help, see **[SETUP.md](./SETUP.md)**

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🗺️ Roadmap

Future features to add:

- [ ] Photo filters/effects
- [ ] Event password protection
- [ ] Photo captions/comments
- [ ] Share to social media
- [ ] Email event link
- [ ] Photo download as ZIP
- [ ] Event analytics
- [ ] Custom branding
- [ ] Dark mode
- [ ] Multi-language support

## 📜 License

MIT License - Feel free to use for personal or commercial projects

## 🙏 Credits

Built with ❤️ for making event memories easier to share.

---

## 💬 Support

Have questions? Check:

1. **[SETUP.md](./SETUP.md)** - Detailed setup guide
2. **[QUICK_REF.md](./QUICK_REF.md)** - Quick reference
3. Browser console (F12) for errors
4. Firebase Console for data issues
5. Cloudinary Dashboard for upload issues

---

**Ready to get started?** [Follow the setup guide →](./SETUP.md)
