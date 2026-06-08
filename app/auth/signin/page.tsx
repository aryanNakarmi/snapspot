import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export default function SignIn() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            SnapSpot
          </h1>
          <p className="text-gray-600">Sign in to manage your events</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>
          <AuthForm mode="signin" />

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-gray-600 hover:text-gray-700"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
