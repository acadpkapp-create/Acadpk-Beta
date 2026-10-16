'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function SignupPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: identifier,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Route new manual signups directly to onboarding
    router.push('/onboarding');
    router.refresh();
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="min-h-screen flex bg-white text-slate-900 font-sans antialiased">
      {/* Left Artwork Panel */}
      <div className="hidden md:block w-1/2 relative bg-[#004d3d] overflow-hidden">
        <img
          src="/images/academy-life.jpg"
          alt="AcadPK Illustration"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />

        <div className="relative h-full flex flex-col justify-between p-12 z-10">
          <a
            href="/"
            className="text-white/85 hover:text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Home
          </a>

          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">AcadPK</h2>
            
            <div className="border-l-2 border-white/50 pl-4 py-0.5">
              <p className="text-white/90 text-sm sm:text-base italic font-normal leading-relaxed mb-3">
                &ldquo;Setting up our entire institute on AcadPK took less than 10 minutes. Fee collection, attendance, and parent updates now run seamlessly on autopilot.&rdquo;
              </p>
              <p className="text-white/75 text-xs sm:text-sm font-medium">
                &mdash; Mrs. S. Khan, Director
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sign-Up Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile Brand Title */}
          <div className="md:hidden mb-8">
            <h2 className="text-3xl font-bold text-slate-900">AcadPK</h2>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight text-center md:text-left">
            Create Your Account
          </h1>
          <p className="text-sm text-slate-500 mb-8 text-center md:text-left">
            Set up your academy on AcadPK today
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 text-xs sm:text-sm rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Email or Phone Number
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or phone"
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#005c45]/20 focus:border-[#005c45] transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#005c45]/20 focus:border-[#005c45] transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#005c45] hover:bg-[#004d3d] active:scale-[0.99] text-white font-medium py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Creating Account…' : 'Get Started'}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-xs text-slate-400">
              Or continue with
            </span>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 font-medium py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>

          {/* Log In Link */}
          <p className="text-sm text-slate-500 mt-8 text-center">
            Already have an account?{' '}
            <a href="/login" className="text-[#005c45] font-semibold hover:underline transition-all">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}