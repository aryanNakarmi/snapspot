'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">S</span>
              </div>
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
                className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-md hover:shadow-indigo-200 transition-all"
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-8">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              No app downloads. No logins required.
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Share Event Photos
              </span>
              <br />
              <span className="text-slate-900">Instantly with QR Codes</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Transform any event into a live photo-sharing space. Guests scan, snap, and share — all from their phone browser. Perfect for weddings, parties, and college events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/organizer/create"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-xl hover:shadow-xl hover:shadow-indigo-200/50 transition-all hover:-translate-y-0.5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Your Event
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 text-lg font-semibold rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 16 16 12 12 8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Three simple steps to turn any event into a shared photo experience.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Create Event',
                description: 'Set up your event in seconds with a name and description. SnapSpot generates a unique QR code and shareable link automatically.',
                gradient: 'from-indigo-500 to-blue-500',
                icon: (
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                ),
              },
              {
                step: '02',
                title: 'Guests Scan & Share',
                description: 'Place the QR code at your venue. Guests scan it with their phone camera — no app download, no login. They take photos and upload instantly.',
                gradient: 'from-purple-500 to-pink-500',
                icon: (
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                ),
              },
              {
                step: '03',
                title: 'Live Gallery',
                description: 'Every uploaded photo appears instantly in the shared gallery. All guests see new memories in real-time as they are added.',
                gradient: 'from-amber-500 to-orange-500',
                icon: (
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                ),
              },
            ].map((feature) => (
              <div key={feature.step} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                <div className="relative bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {feature.icon}
                    </svg>
                  </div>
                  <div className="text-xs font-bold text-slate-400 tracking-widest mb-2">{feature.step}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { value: 'No Login', label: 'Guests share instantly without signing up' },
              { value: 'Real-Time', label: 'Photos appear as they are uploaded' },
              { value: 'Zero Setup', label: 'Just scan the QR code and start sharing' },
            ].map((stat) => (
              <div key={stat.label} className="text-white">
                <p className="text-2xl font-bold mb-2">{stat.value}</p>
                <p className="text-indigo-100 text-sm leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
            Create your first event in under a minute. It is completely free to get started.
          </p>
          <Link
            href="/organizer/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-xl hover:shadow-xl hover:shadow-indigo-200/50 transition-all hover:-translate-y-0.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your Event Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
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
