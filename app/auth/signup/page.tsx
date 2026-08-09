import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import AuthShell from '@/components/AuthShell';

export default function SignUp() {
  return (
    <AuthShell
      chip="Free for Organizers"
      chipIcon={
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      }
      title="Create your account"
      subtitle="Get started with SnapSpot in seconds"
      footer={
        <p>
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
