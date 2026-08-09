import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import AuthShell from '@/components/AuthShell';

export default function SignIn() {
  return (
    <AuthShell
      chip="Organizer Portal"
      chipIcon={
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      }
      title="Welcome back"
      subtitle="Sign in to manage your event galleries"
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline underline-offset-2"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <AuthForm mode="signin" />
    </AuthShell>
  );
}
