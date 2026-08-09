// Pure-CSS phone mockup showing a live SnapSpot event gallery.
// Used on the landing page hero to give visitors a real sense of the product.

const PHOTOS = [
  { gradient: 'from-amber-200 to-orange-300', emoji: '🎂', label: 'Cake' },
  { gradient: 'from-rose-200 to-pink-300', emoji: '🥂', label: 'Toast' },
  { gradient: 'from-sky-200 to-indigo-300', emoji: '🎈', label: 'Decor' },
  { gradient: 'from-emerald-200 to-teal-300', emoji: '💍', label: 'Rings' },
  { gradient: 'from-purple-200 to-fuchsia-300', emoji: '🎤', label: 'Speeches' },
  { gradient: 'from-yellow-100 to-amber-200', emoji: '💃', label: 'Dancing' },
];

export default function PhoneMockup({
  showFloatingCards = true,
}: {
  showFloatingCards?: boolean;
}) {
  return (
    <div className="relative w-[280px] sm:w-[300px]">
      {/* Glow behind the phone */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-400/40 via-purple-400/30 to-pink-400/40 blur-3xl rounded-full scale-110" />

      {/* Phone frame */}
      <div className="relative rounded-[2.6rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/30 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-full z-20" />

        {/* Screen */}
        <div className="bg-slate-50 rounded-[2rem] overflow-hidden">
          {/* App header */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-11 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-indigo-200 font-medium">LIVE EVENT</p>
                <p className="text-white font-bold text-sm leading-tight">Sarah&apos;s Wedding</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 text-white text-[9px] font-semibold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {PHOTOS.map((photo) => (
              <div
                key={photo.label}
                className={`relative aspect-square rounded-lg bg-gradient-to-br ${photo.gradient} flex items-center justify-center overflow-hidden`}
              >
                <span className="text-3xl drop-shadow-sm">{photo.emoji}</span>
                <span className="absolute bottom-1 left-1.5 text-[8px] text-slate-700/60 font-medium">
                  {photo.label}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="px-4 pb-6 pt-1 flex items-center justify-between">
            <div className="flex -space-x-1.5">
              {['from-indigo-400 to-blue-500', 'from-purple-400 to-fuchsia-500', 'from-pink-400 to-rose-500', 'from-amber-400 to-orange-500'].map((g, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full bg-gradient-to-br ${g} ring-2 ring-slate-50`}
                />
              ))}
            </div>
            <p className="text-[9px] text-slate-500 font-medium">128 photos · live</p>
          </div>
        </div>
      </div>

      {/* Floating: upload toast + Find Me chip */}
      {showFloatingCards && (
        <>
          <div className="hidden sm:flex absolute -left-24 top-16 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 px-3.5 py-2.5 items-center gap-2.5 animate-float">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-800">Photo uploaded</p>
              <p className="text-[9px] text-slate-400">just now</p>
            </div>
          </div>

          <div
            className="hidden sm:flex absolute -right-20 bottom-24 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 px-3.5 py-2.5 items-center gap-2.5 animate-float"
            style={{ animationDelay: '1.5s' }}
          >
            <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-800">You&apos;re in 3 photos</p>
              <p className="text-[9px] text-slate-400">Find Me</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
