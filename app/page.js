'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';
import { Logo } from './_components/logo';
import { Fragment } from 'react';

function useCountUp(target, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null || target === 0) return;
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
      <svg className="w-6 h-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp, not another app',
    desc: 'Fee reminders and updates land where parents already are.',
    icon: (
      <svg className="w-6 h-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 9.5c.3 2.7 2.3 4.7 5 5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Built for how you actually teach',
    desc: 'Quran and IELTS tracking, not a repurposed school ERP.',
    icon: (
      <svg className="w-6 h-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
    price: 'PKR 600–700',
    period: '/mo',
    desc: 'Everything a growing academy needs.',
    features: [
      'Unlimited students',
      'Multiple Tutors',
      'WhatsApp fee reminders',
      'Parent portal',
      '+ Quran/IELTS module (add-on)',
    ],
    cta: 'Get Growth',
    popular: true,
  },
  {
    name: 'Institute',
    price: 'PKR 1,500–2,000',
    period: '/mo',
    desc: 'For multi-tutor academies and branches.',
    features: ['Everything in Growth', 'Multiple staff/tutors', 'Both modules included', 'Priority support'],
    cta: 'Talk to us',
    popular: false,
  },
];

const COMPARISON_FEATURES = [
  {
    category: 'Core Management',
    items: [
      { name: 'Student Capacity', free: 'Up to 15', growth: 'Unlimited', institute: 'Unlimited' },
      { name: 'Teacher / Staff Accounts', free: '1 Tutor', growth: 'Multiple Tutors', institute: 'Multiple Staff / Tutors' },
      { name: 'Attendance Tracking', free: true, growth: true, institute: true },
      { name: 'Fee & Payment Ledger', free: true, growth: true, institute: true },
    ],
  },
  {
    category: 'Communication & Portals',
    items: [
      { name: 'WhatsApp Fee Reminders', free: false, growth: true, institute: true },
      { name: 'Parent Access Portal', free: false, growth: true, institute: true },
      { name: 'Customized Fee Slips', free: false, growth: true, institute: true },
    ],
  },
  {
    category: 'Specialized Modules',
    items: [
      { name: 'Quran / IELTS Module', free: false, growth: 'Paid Add-on', institute: 'Included' },
      { name: 'Multi-Branch Support', free: false, growth: false, institute: true },
      { name: 'Dedicated Support', free: 'Standard', growth: 'Standard', institute: 'Priority 24/7' },
    ],
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

  // Modal State: 'privacy' | 'terms' | 'contact' | null
  const [activeModal, setActiveModal] = useState(null);

  // Animated Stat Counters
  const countAcademies = useCountUp(500);
  const countStudents = useCountUp(50);
  const countFees = useCountUp(1);

  // Flawless Smooth Scroll Handler
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-800">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <Logo size={26} textClassName="text-lg font-bold text-slate-900" />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, 'features')}
              className="hover:text-emerald-700 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={(e) => scrollToSection(e, 'pricing')}
              className="hover:text-emerald-700 transition-colors"
            >
              Pricing
            </a>
            <button
              onClick={() => setActiveModal('contact')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Contact Us
            </button>
            <a href="/login" className="hover:text-emerald-700 transition-colors">
              Log in
            </a>
          </nav>

          <a
            href="/signup"
            className="bg-[#004d3d] hover:bg-[#00382c] active:scale-[0.97] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow"
          >
            Get Started
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] -z-10 bg-emerald-100/40 rounded-full blur-[130px]" />
        <div className="px-6 md:px-12 max-w-5xl mx-auto text-center pt-8 pb-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Now piloting across Pakistan
            </span>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-6">
              Empowering Pakistan&rsquo;s academies,
              <br />
              <span className="text-[#004d3d]">one classroom at a time.</span>
            </h1>

            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto mb-9 leading-relaxed">
              Attendance, fees, and parent updates &mdash; handled quietly, in one
              place. Built for tuition centers, Quran academies, and IELTS
              coaches who&rsquo;d rather teach than do paperwork.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/signup"
                className="w-full sm:w-auto bg-[#004d3d] hover:bg-[#00382c] active:scale-[0.97] text-white text-sm font-semibold px-7 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg text-center"
              >
                Get Started Now
              </a>
              <a
                href="#pricing"
                onClick={(e) => scrollToSection(e, 'pricing')}
                className="w-full sm:w-auto border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold px-7 py-3.5 rounded-full transition-all shadow-xs text-center"
              >
                See pricing
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Classroom Hero Image */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl aspect-[16/8] md:aspect-[21/9]"
        >
          <img
            src="/images/academy-life.jpg"
            alt="A modern Pakistani classroom"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>

      {/* Trusted By Badges & 3 Metric Cards Section */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto mb-28">
        {/* Trusted By Badges */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-6">
            TRUSTED BY LEADING INSTITUTIONS ACROSS PAKISTAN
          </p>

          <div className="flex items-center justify-center gap-10 md:gap-16 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-[#004d3d] transition-colors cursor-pointer group">
              <svg className="w-6 h-6 text-slate-500 group-hover:text-[#004d3d] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                <path d="M12 6.5l3.5 2v4l-3.5 2-3.5-2v-4l3.5-2z" />
              </svg>
              <span className="text-[10px] font-bold tracking-wider uppercase">Tanzim Academy</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-[#004d3d] transition-colors cursor-pointer group">
              <svg className="w-6 h-6 text-slate-500 group-hover:text-[#004d3d] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M9 7h6M9 11h6M9 15h4" />
              </svg>
              <span className="text-[10px] font-bold tracking-wider uppercase">Hikmah School</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-[#004d3d] transition-colors cursor-pointer group">
              <svg className="w-6 h-6 text-slate-500 group-hover:text-[#004d3d] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <span className="text-[10px] font-bold tracking-wider uppercase">Pak-IELTS Prep</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <p className="font-display text-4xl font-extrabold text-slate-900 mb-1">{countAcademies}+</p>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">Active Academies</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="font-display text-4xl font-extrabold text-slate-900 mb-1">{countStudents}k+</p>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">Students Managed</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
            </div>
            <p className="font-display text-4xl font-extrabold text-slate-900 mb-1">{countFees}M+</p>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">Fees Processed (PKR)</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 md:px-12 max-w-6xl mx-auto mb-28 scroll-mt-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Designed for real classroom workflows
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
            Everything you need without the bloated complexity of legacy school software.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-start"
            >
              <div className="w-10 h-10 mb-4 bg-emerald-50 rounded-xl flex items-center justify-center">
                {f.icon}
              </div>
              <p className="font-display font-bold text-slate-900 text-lg mb-2">{f.title}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 md:px-12 max-w-6xl mx-auto mb-28 scroll-mt-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Transparent pricing for every stage
          </h2>
          <p className="text-slate-500 text-sm sm:text-base">No hidden fees. Cheaper than anything else out there.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch mb-16">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-8 bg-white border flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? 'border-[#004d3d] shadow-lg ring-1 ring-[#004d3d]/20 md:-translate-y-2'
                  : 'border-slate-200/90 shadow-xs hover:shadow-xl'
              }`}
            >
              <div>
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#004d3d] text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-sm tracking-wide">
                    Most Popular
                  </span>
                )}
                
                <p className="font-display font-bold text-slate-900 text-xl">{plan.name}</p>
                <p className="text-xs text-slate-500 mt-1 mb-6 min-h-[32px]">{plan.desc}</p>
                
                <p className="font-display text-4xl font-extrabold text-slate-900 mb-6">
                  {plan.price}
                  <span className="text-xs font-normal text-slate-500">{plan.period}</span>
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 mt-0.5 shrink-0">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="/signup"
                className={`block text-center text-sm font-semibold py-3 rounded-full transition-all duration-200 active:scale-[0.97] ${
                  plan.popular
                    ? 'bg-[#004d3d] hover:bg-[#00382c] text-white shadow-sm hover:shadow'
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 md:p-8">
          <div className="text-center md:text-left mb-8">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-1">
              Compare Plan Features
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              Detailed breakdown of features included across each plan tier.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-900 text-xs sm:text-sm font-bold">
                  <th className="py-4 px-4 w-2/5">Features</th>
                  <th className="py-4 px-4 text-center w-1/5">Free</th>
                  <th className="py-4 px-4 text-center w-1/5 text-[#004d3d]">Growth</th>
                  <th className="py-4 px-4 text-center w-1/5">Institute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
  {COMPARISON_FEATURES.map((cat) => (
    <Fragment key={cat.category}>
      {/* Category Header Row */}
      <tr>
        <td colSpan={4} className="bg-slate-50/80 font-bold text-slate-900 py-3 px-4 text-xs tracking-wider uppercase">
          {cat.category}
        </td>
      </tr>

      {/* Category Items Rows */}
      {cat.items.map((item) => (
        <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
          <td className="py-3.5 px-4 font-medium text-slate-800">{item.name}</td>
          <td className="py-3.5 px-4 text-center">
            {typeof item.free === 'boolean' ? (
              item.free ? (
                <svg className="w-5 h-5 text-emerald-600 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-slate-300">&mdash;</span>
              )
            ) : (
              <span className="text-slate-600 font-medium">{item.free}</span>
            )}
          </td>
          <td className="py-3.5 px-4 text-center bg-emerald-50/30 font-medium">
            {typeof item.growth === 'boolean' ? (
              item.growth ? (
                <svg className="w-5 h-5 text-emerald-600 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-slate-300">&mdash;</span>
              )
            ) : (
              <span className="text-[#004d3d] font-semibold">{item.growth}</span>
            )}
          </td>
          <td className="py-3.5 px-4 text-center">
            {typeof item.institute === 'boolean' ? (
              item.institute ? (
                <svg className="w-5 h-5 text-emerald-600 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-slate-300">&mdash;</span>
              )
            ) : (
              <span className="text-slate-900 font-semibold">{item.institute}</span>
            )}
          </td>
        </tr>
      ))}
    </Fragment>
  ))}
</tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="px-6 md:px-12 max-w-xl mx-auto mb-28 scroll-mt-24">
        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-md hover:shadow-xl transition-all duration-300 p-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-display text-xl font-bold text-slate-900">You&rsquo;re on the list!</p>
                <p className="text-sm text-slate-500 mt-2">
                  We&rsquo;ll reach out personally to get your academy onboarded.
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}>
                <p className="font-display font-bold text-slate-900 text-xl mb-1">Join the pilot waitlist</p>
                <p className="text-xs sm:text-sm text-slate-500 mb-6">Free during the pilot period. No credit card required.</p>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 text-sm rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#004d3d] hover:bg-[#00382c] active:scale-[0.97] text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full disabled:opacity-50 transition-all whitespace-nowrap shadow-sm"
                  >
                    {loading ? 'Joining…' : 'Request access'}
                  </button>
                </div>

                {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}

                <button
                  type="button"
                  onClick={() => setShowMore((v) => !v)}
                  className="text-xs text-slate-400 hover:text-slate-700 mt-4 transition-colors font-medium cursor-pointer"
                >
                  {showMore ? 'Hide extra details' : '+ Add academy details (optional)'}
                </button>

                <AnimatePresence>
                  {showMore && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-2.5 mt-3 pt-1">
                        <input
                          type="text"
                          placeholder="Academy name"
                          value={academyName}
                          onChange={(e) => setAcademyName(e.target.value)}
                          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
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

      {/* Dark Footer */}
      <footer className="bg-[#24282b] text-[#e0e3e5] pt-14 pb-10 border-t border-[#34383c]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-10 border-b border-[#34383c]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Logo size={24} textClassName="text-white font-bold text-xl" />
              </div>
              <p className="text-xs text-[#9ea4a8]">
                Modernizing educational management across Pakistan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-8 text-sm font-semibold text-[#e0e3e5]">
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, 'features')}
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={(e) => scrollToSection(e, 'pricing')}
                className="hover:text-white transition-colors"
              >
                Pricing
              </a>
              <button
                onClick={() => setActiveModal('contact')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contact Support
              </button>
              <a href="/login" className="text-[#6df8c1] hover:underline font-bold">
                Login
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-xs text-[#9ea4a8]">
            <p>
              © 2026 AcadPK. Crafted with care by{' '}
              <a
                href="https://codicesolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6df8c1] hover:underline font-bold"
              >
                Codice Solutions
              </a>
              . All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveModal('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setActiveModal('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Popups / Modal Overlays */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-slate-200 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {activeModal === 'privacy' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-900">Privacy Policy</h3>
                  </div>
                  <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600">
                    <p>
                      At <strong>AcadPK</strong> (a product of <strong>Codice Solutions</strong>), we prioritize the privacy and data integrity of educational institutions, tutors, and parents across Pakistan.
                    </p>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">1. Information We Collect</h4>
                      <p>We store institutional data including student records, attendance status, and fee tracking logs strictly for academy administrative workflows.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">2. Data Confidentiality</h4>
                      <p>Your records are never sold or shared with third-party advertisers. Data is used exclusively for generating fee slips and sending updates.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">3. Security</h4>
                      <p>All stored records are encrypted in transit and at rest with strict database access restrictions.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'terms' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-900">Terms of Service</h3>
                  </div>
                  <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600">
                    <p>
                      By accessing or using <strong>AcadPK</strong>, you agree to these service terms provided by <strong>Codice Solutions</strong>.
                    </p>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">1. Account Responsibility</h4>
                      <p>Academy managers are responsible for maintaining secure credentials and ensuring authorized access for their teaching staff.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">2. Service Uptime</h4>
                      <p>AcadPK aims for 99.9% uptime during operational hours. Periodic updates are conducted with zero disruption to daily attendance logging.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">3. Acceptable Use</h4>
                      <p>The platform must be used solely for legitimate educational management. Misuse or attempted system tampering results in immediate suspension.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'contact' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-900">Contact Support</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6">
                    Need help setting up your academy or have questions about custom plans? Our team at <strong>Codice Solutions</strong> is ready to assist you.
                  </p>

                  <div className="space-y-3 mb-6">
                    <a
                      href="https://wa.me/923000000000?text=Hi%20AcadPK,%20I%20would%20like%20to%20know%20more%20about%20your%20services."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 transition-colors text-slate-900 font-semibold text-xs sm:text-sm"
                    >
                      <svg className="w-5 h-5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      <span>Chat on WhatsApp (+92 300 0000000)</span>
                    </a>

                    <a
                      href="mailto:support@acadpk.com"
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 transition-colors text-slate-900 font-semibold text-xs sm:text-sm"
                    >
                      <svg className="w-5 h-5 text-emerald-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>Email Support (support@acadpk.com)</span>
                    </a>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl text-center border border-slate-200/60">
                    Parent Organization: <strong>Codice Solutions</strong> • Mon to Sat (9 AM – 6 PM PKT)
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-[#004d3d] hover:bg-[#00382c] text-white rounded-full text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}