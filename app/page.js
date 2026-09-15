'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';
import { Logo } from './_components/logo';

function useCountUp(target, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let start = null;
    function step(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, durationMs]);
  return value;
}

const FEATURES = [
  {
    title: 'Attendance, in seconds',
    desc: 'Mark a class present, absent, or on leave in a couple of taps.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp, not another app',
    desc: 'Fee reminders and updates land where parents already are.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 9.5c.3 2.7 2.3 4.7 5 5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Built for how you actually teach',
    desc: 'Quran and IELTS tracking, not a repurposed school ERP.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" strokeLinecap="round" />
      </svg>
    ),
  },
];

const PLANS = [
  {
    name: 'Free',
    price: 'PKR 0',
    period: '',
    desc: 'A real trial, not a countdown.',
    features: ['Up to 15 students', '1 tutor', 'Attendance & fee tracker'],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Growth',
    price: 'PKR 600\u2013700',
    period: '/mo',
    desc: 'Everything a growing academy needs.',
    features: [
      'Unlimited students',
      'WhatsApp fee reminders',
      'Parent portal',
      '+ Quran/IELTS module (add-on)',
    ],
    cta: 'Get Growth',
    popular: true,
  },
  {
    name: 'Institute',
    price: 'PKR 1,500\u20132,000',
    period: '/mo',
    desc: 'For multi-tutor academies and branches.',
    features: ['Everything in Growth', 'Multiple staff/tutors', 'Both modules included', 'Priority support'],
    cta: 'Talk to us',
    popular: false,
  },
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [city, setCity] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc('get_public_stats').then(({ data }) => {
      if (data) setStats(data);
    });
  }, []);

  const academyCount = useCountUp(stats?.academies_count ?? 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('waitlist')
      .insert({ email, academy_name: academyName || null, city: city || null });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-outline">
        <div className="flex items-center justify-between px-6 md:px-10 py-4 max-w-6xl mx-auto">
          <Logo size={26} textClassName="text-lg" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
            <a href="/login" className="hover:text-ink transition-colors">Log in</a>
          </nav>
          <a
            href="#waitlist"
            className="bg-brand-600 hover:bg-brand-700 active:scale-[0.97] text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            Get Started
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] -z-10 bg-brand-100/60 rounded-full blur-[120px]" />
        <div className="px-6 md:px-10 max-w-3xl mx-auto text-center pt-16 pb-14">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              Now piloting across Pakistan
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-ink leading-[1.08] mb-5">
              Empowering Pakistan&rsquo;s academies,
              <br />
              <span className="text-brand-600">one classroom at a time.</span>
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto mb-9">
              Attendance, fees, and parent updates &mdash; handled quietly, in one
              place. Built for tuition centers, Quran academies, and IELTS
              coaches who&rsquo;d rather teach than do paperwork.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="#waitlist"
                className="bg-brand-600 hover:bg-brand-700 active:scale-[0.97] text-white text-sm font-medium px-6 py-3 rounded-lg transition-all"
              >
                Get Started Now
              </a>
              <a
                href="#pricing"
                className="border border-outline hover:bg-white text-ink text-sm font-medium px-6 py-3 rounded-lg transition-all"
              >
                See pricing
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Real photo panel */}
      <section className="px-6 md:px-10 max-w-4xl mx-auto mb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-xl overflow-hidden border border-outline shadow-glass aspect-[16/8]"
        >
          <img
            src="/images/academy-life.jpg"
            alt="A modern Pakistani classroom"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>

      {/* Live stat */}
      <section className="px-6 text-center mb-24">
        <p className="font-display text-5xl font-bold text-brand-600">{academyCount}</p>
        <p className="text-sm text-muted mt-1">
          {academyCount === 1 ? 'academy already on AcadPK' : 'academies already on AcadPK'}
        </p>
      </section>

      {/* Features */}
      <section id="features" className="px-6 md:px-10 max-w-3xl mx-auto mb-24">
        <div className="grid sm:grid-cols-3 gap-10">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="w-9 h-9 text-brand-500 mb-4">{f.icon}</div>
              <p className="font-display font-semibold text-ink mb-1">{f.title}</p>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 md:px-10 max-w-5xl mx-auto mb-24">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-ink mb-2">
            Transparent pricing for every stage
          </h2>
          <p className="text-muted">No hidden fees. Cheaper than anything else out there.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 bg-white border ${
                plan.popular ? 'border-brand-400 shadow-glass' : 'border-outline'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <p className="font-display font-semibold text-ink">{plan.name}</p>
              <p className="text-sm text-muted mt-1 mb-4">{plan.desc}</p>
              <p className="font-display text-3xl font-bold text-ink mb-4">
                {plan.price}
                <span className="text-sm font-normal text-muted">{plan.period}</span>
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-500 mt-0.5 shrink-0">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`block text-center text-sm font-medium py-2.5 rounded-lg transition-all active:scale-[0.97] ${
                  plan.popular
                    ? 'bg-brand-600 hover:bg-brand-700 text-white'
                    : 'border border-outline hover:bg-canvas text-ink'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="px-6 md:px-10 max-w-md mx-auto mb-20">
        <div className="rounded-xl border border-outline bg-white/70 backdrop-blur-xl shadow-glass p-6">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <p className="font-display font-semibold text-ink">You&rsquo;re on the list</p>
                <p className="text-sm text-muted mt-1">
                  We&rsquo;ll reach out personally to get your academy set up.
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}>
                <p className="font-display font-semibold text-ink mb-1">Join the pilot waitlist</p>
                <p className="text-sm text-muted mb-4">Free during the pilot. No credit card.</p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-outline focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-600 hover:bg-brand-700 active:scale-[0.97] text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 transition-all whitespace-nowrap"
                  >
                    {loading ? 'Joining…' : 'Request access'}
                  </button>
                </div>

                {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}

                <button
                  type="button"
                  onClick={() => setShowMore((v) => !v)}
                  className="text-xs text-muted hover:text-ink mt-3 transition-colors"
                >
                  {showMore ? 'Hide extra details' : 'Add academy details (optional)'}
                </button>

                <AnimatePresence>
                  {showMore && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Academy name"
                          value={academyName}
                          onChange={(e) => setAcademyName(e.target.value)}
                          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-outline focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-outline focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center border-t border-outline">
        <Logo size={22} textClassName="text-sm" className="justify-center" />
        <p className="text-xs text-muted mt-2">
          by Codice Solutions &middot;{' '}
          <a href="/login" className="underline hover:text-ink">Log in</a>
        </p>
      </footer>
    </main>
  );
}
