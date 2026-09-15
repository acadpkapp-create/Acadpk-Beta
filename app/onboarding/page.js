'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function OnboardingPage() {
  const [academyName, setAcademyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You need to be logged in first.');
      setLoading(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc('create_academy_with_owner', {
      academy_name: academyName,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Name your academy</h1>
        <p className="text-sm text-gray-500 mb-6">This is what parents and staff will see.</p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <label className="block text-sm font-medium text-gray-700 mb-1">Academy name</label>
        <input
          type="text"
          required
          value={academyName}
          onChange={(e) => setAcademyName(e.target.value)}
          placeholder="e.g. Al-Falah Tuition Academy"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create academy'}
        </button>
      </form>
    </main>
  );
}
