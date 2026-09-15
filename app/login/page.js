'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Logo } from '../_components/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen md:flex">
      {/* Image panel */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src="/images/academy-life.jpg"
          alt="A modern Pakistani classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-700/90 via-brand-700/40 to-brand-700/10" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <a href="/" className="text-white/90 text-sm inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </a>
          <div>
            <Logo size={30} textClassName="text-2xl" light className="mb-3" />
            <p className="text-white/70 text-sm max-w-xs">
              One quiet place for attendance, fees, and parent updates &mdash;
              built for Pakistani academies.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-up">
          <div className="md:hidden mb-8">
            <Logo size={26} textClassName="text-lg" />
          </div>

          <h1 className="font-display text-2xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Log in to your management portal.</p>

          {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

          <label className="block text-sm font-medium text-ink mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-outline rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <label className="block text-sm font-medium text-ink mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-outline rounded-lg px-3 py-2.5 mb-6 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 active:scale-[0.97] text-white font-medium py-2.5 rounded-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p className="text-sm text-muted mt-4 text-center">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-brand-600 font-medium">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
