'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';
import PhoneMockup from '@/components/PhoneMockup';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/organizer/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafaf8]">
        <div className="flex flex-col items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] text-slate-900">
      {/* ── Navigation ── */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="SnapSpot" className="w-9 h-9 rounded-lg shadow-sm" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SnapSpot
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/organizer/create"
                className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Dot grid + ambient glows */}
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgb(15_23_42/0.07)_1px,transparent_0)] [background-size:26px_26px]" />
        <div className="pointer-events-none absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 w-[32rem] h-[32rem] rounded-full bg-purple-200/40 blur-3xl" />
        <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-[40rem] h-72 bg-pink-100/40 blur-3xl rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-10 items-center">
            {/* Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full shadow-sm mb-8 animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                No app downloads. No logins required.
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-up animation-delay-100">
                Every moment,
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  in one gallery.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-fade-up animation-delay-200">
                Guests scan a QR code, snap photos, and watch the album come
                alive in real time. Perfect for weddings, parties, and college
                events.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up animation-delay-300">
                <Link
                  href="/organizer/create"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-xl hover:shadow-xl hover:shadow-indigo-200/60 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Your Event
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 bg-white/60 text-slate-700 text-lg font-semibold rounded-xl hover:border-indigo-300 hover:bg-white hover:text-indigo-600 active:scale-[0.98] transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 16 16 12 12 8" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  How It Works
                </a>
              </div>

            </div>

            {/* Product mockup */}
            <div className="relative flex justify-center lg:justify-end animate-fade-up animation-delay-200">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
              How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              From QR scan to photo album
              <br className="hidden md:block" /> in three steps
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Three simple steps to turn any event into a shared photo experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: '01',
                title: 'Create Event',
                description: 'Set up your event in seconds with a name and description. SnapSpot generates a unique QR code and shareable link automatically.',
                gradient: 'from-indigo-500 to-blue-500',
                icon: <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />,
              },
              {
                step: '02',
                title: 'Guests Scan & Share',
                description: 'Place the QR code at your venue. Guests scan it with their phone camera — no app download, no login. They take photos and upload instantly.',
                gradient: 'from-purple-500 to-pink-500',
                icon: <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />,
              },
              {
                step: '03',
                title: 'Live Gallery',
                description: 'Every uploaded photo appears instantly in the shared gallery. All guests see new memories in real-time as they are added.',
                gradient: 'from-amber-500 to-orange-500',
                icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
              },
            ].map((feature, i) => (
              <div
                key={feature.step}
                className="group relative bg-[#fafaf8] border border-slate-200/70 rounded-2xl p-8 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1.5 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {feature.icon}
                    </svg>
                  </div>
                  <span className="text-5xl font-black text-slate-200 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {feature.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Features (dark band) ── */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 w-[30rem] h-[30rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 w-[26rem] h-[26rem] rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.06)_1px,transparent_0)] [background-size:26px_26px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
              Powered by AI
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Smarter than a photo dump
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              SnapSpot organizes, protects, and personalizes every album — automatically.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
                title: 'AI Moderation',
                description: 'Inappropriate content is blocked automatically before it ever posts.',
                accent: 'text-emerald-400 bg-emerald-400/10',
              },
              {
                icon: <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />,
                title: 'Smart Grouping',
                description: 'Faces, objects, and moments are grouped into stories automatically.',
                accent: 'text-indigo-300 bg-indigo-400/10',
              },
              {
                icon: (
                  <>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </>
                ),
                title: 'Find Me',
                description: 'Guests upload a selfie and find every photo they appear in — on-device.',
                accent: 'text-pink-400 bg-pink-400/10',
              },
              {
                icon: <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0" />,
                title: 'Works Offline',
                description: 'Photos queue on the device and upload automatically when back online.',
                accent: 'text-amber-400 bg-amber-400/10',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.accent}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center border-t border-white/10 pt-12">
            {[
              { value: '0', label: 'Logins for guests' },
              { value: 'Real-Time', label: 'Photos appear instantly' },
              { value: 'Zero Setup', label: 'Just scan the QR code' },
            ].map((stat, i) => (
              <div key={stat.label} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgb(15_23_42/0.05)_1px,transparent_0)] [background-size:26px_26px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-2xl shadow-indigo-200/60">
            <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.2)_1px,transparent_0)] [background-size:20px_20px]" />

            <div className="relative grid lg:grid-cols-2 gap-12 items-center px-8 py-16 md:px-14 md:py-20">
              {/* Copy + checklist */}
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-full mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Free to start · No credit card
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Turn your next event
                  <br />
                  into a shared album
                </h2>
                <p className="text-lg text-indigo-100 mb-8 max-w-md leading-relaxed">
                  Create your event in under a minute, put up the QR code, and
                  let your guests do the rest.
                </p>

                <ul className="space-y-3 mb-10">
                  {[
                    'A live gallery every guest can add to',
                    'Guests find themselves instantly with Find Me',
                    'AI moderation keeps it family-friendly',
                  ].map((item, i) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-white/90 animate-fade-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <span className="w-6 h-6 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/organizer/create"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-xl shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Your Event Now
                </Link>
              </div>

              {/* Product mockup */}
              <div className="hidden lg:flex justify-center animate-fade-up animation-delay-200">
                <PhoneMockup showFloatingCards={false} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/icons/icon-192.png" alt="SnapSpot" className="w-6 h-6 rounded" />
              <span className="text-sm font-semibold text-slate-700">SnapSpot</span>
            </div>
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} SnapSpot. Making event memories easier to share.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
