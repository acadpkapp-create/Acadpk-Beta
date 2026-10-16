'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function OnboardingPage() {
  const [instituteName, setInstituteName] = useState('');
  const [instituteType, setInstituteType] = useState('School / College');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Real-time URL slug preview
  const slug = instituteName
    ? instituteName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    : 'your-institute';

  const categories = [
    { label: 'School / College', icon: '🏫' },
    { label: 'Tuition / Coaching', icon: '📚' },
    { label: 'Quran Academy / Hifz', icon: '📖' },
    { label: 'IELTS / Test Prep', icon: '🎯' },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!instituteName.trim()) return;

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

    // Omit 'city' to avoid missing column errors in the database schema
    const { error: rpcError } = await supabase.rpc('create_institute_with_owner', {
      institute_name: instituteName,
      institute_type: instituteType,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Left Panel - Deep Dark Emerald */}
      <div className="hidden lg:flex w-5/12 bg-[#062017] relative flex-col justify-between p-12 overflow-hidden text-white">
        {/* Architectural Background Texture */}
        <img
          src="/images/academy-life.jpg"
          alt="AcadPK Illustration"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
        />

        {/* Dark Muted Emerald Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#062017] via-[#092b20] to-[#004d3d]/45" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              Setup • Step 1 of 2
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">Welcome to AcadPK!</h2>
          <p className="text-emerald-100/70 text-sm leading-relaxed max-w-sm">
            Let’s configure your digital management portal in under a minute.
          </p>
        </div>

        {/* Stepper */}
        <div className="relative z-10 space-y-6 my-auto">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#005c45] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-lg shadow-black/40 ring-4 ring-[#005c45]/20">
              1
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Institute Profile</h4>
              <p className="text-xs text-emerald-100/70">Set your official institute name & type</p>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-emerald-900/60 ml-4"></div>

          <div className="flex items-start gap-4 opacity-50">
            <div className="w-8 h-8 rounded-full border border-emerald-800 bg-emerald-950/40 text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-sm text-emerald-100">Dashboard Access</h4>
              <p className="text-xs text-emerald-200/50">Generate portals for staff & students</p>
            </div>
          </div>
        </div>

        {/* Footer Helper Tip */}
        <div className="relative z-10 border-t border-emerald-900/50 pt-6">
          <p className="text-xs text-emerald-200/60 italic leading-relaxed">
            &ldquo;You can update your institute information, branding, and add staff members anytime from Settings.&rdquo;
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-[460px]">
          {/* Mobile Header Badge */}
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">AcadPK</h2>
            <span className="bg-emerald-50 text-[#005c45] border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold">
              Step 1 of 2
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Name your institute
          </h1>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            This name will appear on fee receipts, student ID cards, and official reports.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 text-xs sm:text-sm rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                {error}
              </div>
            )}

            {/* Institute Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Institute Type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setInstituteType(cat.label)}
                    className={`flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-lg border text-left transition-all cursor-pointer ${
                      instituteType === cat.label
                        ? 'border-[#005c45] bg-emerald-50/50 text-[#005c45] ring-1 ring-[#005c45]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Institute Name Input */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Institute Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                placeholder="e.g. Al-Falah Model School"
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#005c45]/20 focus:border-[#005c45] transition-all placeholder:text-slate-400"
              />
            </div>

            {/* City Input (Optional/UI-only) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                City / Location <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lahore, Rawalpindi"
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#005c45]/20 focus:border-[#005c45] transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Live Domain Slug Preview Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1">
              <span className="text-slate-400 font-medium">Your Institute Portal Link:</span>
              <div className="font-mono text-[#005c45] font-semibold truncate flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" />
                </svg>
                acadpk.com/{slug}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !instituteName.trim()}
              className="w-full bg-[#005c45] hover:bg-[#004d3d] active:scale-[0.99] text-white font-medium py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <span>{loading ? 'Creating Institute…' : 'Continue to Dashboard'}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}