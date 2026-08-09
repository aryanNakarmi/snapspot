import Link from 'next/link';
import { ReactNode } from 'react';

interface AuthShellProps {
  chip: string;
  chipIcon?: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const BRAND_FEATURES = [
  {
    icon: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    title: 'Scan & share',
    description: 'Guests join with one QR scan — no downloads, no sign-ups.',
  },
  {
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    title: 'Find anyone',
    description: 'Face search finds every photo a guest appears in — on-device.',
  },
  {
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
    title: 'Automatically safe',
    description: 'AI moderation blocks inappropriate content before it posts.',
  },
];

export default function AuthShell({
  chip,
  chipIcon,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* ── Brand panel (desktop) ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-950 overflow-hidden">
        {/* Ambient glow + dot grid */}
        <div className="pointer-events-none absolute -top-40 -right-32 w-[30rem] h-[30rem] rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 w-[26rem] h-[26rem] rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.07)_1px,transparent_0)] [background-size:24px_24px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 animate-fade-up">
          <img src="/icons/icon-192.png" alt="SnapSpot" className="w-9 h-9 rounded-lg ring-2 ring-white/10" />
          <span className="text-lg font-bold text-white">SnapSpot</span>
        </div>

        {/* Headline + features */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-10 animate-fade-up">
            Your event photos,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              beautifully collected.
            </span>
          </h2>

          <ul className="space-y-6">
            {BRAND_FEATURES.map((feature, i) => (
              <li
                key={feature.title}
                className="flex items-start gap-4 animate-fade-up"
                style={{ animationDelay: `${150 + i * 100}ms` }}
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {feature.icon}
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-0.5">{feature.title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer note */}
        <p className="relative text-xs text-slate-500 animate-fade-up animation-delay-400">
          © {new Date().getFullYear()} SnapSpot · Making event memories easier to share.
        </p>
      </div>

      {/* ── Form side ── */}
      <div className="relative flex items-center justify-center px-6 py-16 bg-[#fafaf8] min-h-screen lg:min-h-0">
        {/* Subtle top glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-64 rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <img src="/icons/icon-192.png" alt="SnapSpot" className="w-10 h-10 rounded-xl shadow-sm" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SnapSpot
            </span>
          </div>

          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-full shadow-sm mb-4">
              {chipIcon}
              {chip}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500">{subtitle}</p>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-7">
            {children}
          </div>

          <div className="mt-5 text-center text-sm text-slate-500">{footer}</div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
