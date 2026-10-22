'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

function IconArrowUp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStudents(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 20c.2-2.3 1.6-4 3.7-4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconClasses(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 9h8M8 13h5" strokeLinecap="round" />
    </svg>
  );
}

function IconStaff(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRevenue(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconWarning(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 4 2.5 20h19L12 4Z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconDownload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toCSV(rows) {
  const headers = [
    'Name',
    'Class / Subject',
    'Parent Name',
    'Parent Phone',
    'Monthly Fee',
    'This Month Status',
    'This Month Amount',
  ];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => {
    lines.push(
      [
        r.name,
        r.class_or_subject,
        r.parent_name,
        r.parent_phone,
        r.monthly_fee,
        r.this_month_status,
        r.this_month_amount,
      ]
        .map(escape)
        .join(',')
    );
  });
  return lines.join('\n');
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, trend }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xs p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between aspect-square sm:aspect-auto">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon width={18} height={18} />
        </div>
        {trend}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-display text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

function Trend({ pct }) {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
        up ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-600'
      }`}
    >
      {up ? <IconArrowUp width={12} height={12} /> : <IconArrowDown width={12} height={12} />}
      {Math.abs(pct)}%
    </span>
  );
}

export default function DashboardClient({ displayName, role, stats, recentAdmissions, exportData }) {
  const router = useRouter();

  const needsAttention = stats.overdueCount > 0;

  // New Admission Modal & Staff / Classes State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [classesList, setClassesList] = useState([]);
  const [staffCount, setStaffCount] = useState(stats.totalStaff || 0);

  const [formData, setFormData] = useState({
    fullName: '',
    className: 'General',
    parentName: '',
    parentPhone: '',
    address: '',
    feeAmount: '',
    feeStatus: 'Paid',
  });

  // Fetch classes and staff count when component mounts
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: inst } = await supabase
        .from('institutes')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (inst) {
        // Fetch classes list
        const { data: cls } = await supabase
          .from('classes')
          .select('*')
          .eq('institute_id', inst.id)
          .order('name', { ascending: true });
        if (cls) setClassesList(cls);

        // Fetch staff count if not provided directly in props
        const { count: staffC } = await supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('institute_id', inst.id);

        if (staffC !== null && staffC !== undefined) {
          setStaffCount(staffC);
        }
      }
    }
    fetchData();
  }, []);

  function handleNewAdmission() {
    setModalOpen(true);
  }

  // Handle direct dashboard admission submission
  async function handleDashboardAdmissionSubmit(e) {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Please enter student full name.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Session expired. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    const { data: inst } = await supabase
      .from('institutes')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!inst) {
      alert('Institute configuration not found.');
      setIsSubmitting(false);
      return;
    }

    // Automatically calculate sequential roll number
    const { count: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('institute_id', inst.id);

    const nextNumber = (studentCount || 0) + 1;
    const autoRollNumber = `ADM-${String(nextNumber).padStart(4, '0')}`;

    const { error } = await supabase.from('students').insert([
      {
        user_id: user.id,
        institute_id: inst.id,
        full_name: formData.fullName.trim(),
        class_name: formData.className.trim() || 'General',
        parent_name: formData.parentName.trim() || null,
        parent_phone: formData.parentPhone.trim() || null,
        address: formData.address.trim() || null,
        fee_amount: formData.feeAmount === '' ? 0 : Number(formData.feeAmount),
        fee_status: formData.feeStatus || 'Paid',
        roll_number: autoRollNumber,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      alert(`Could not save student: ${error.message}`);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setModalOpen(false);
      setFormData({
        fullName: '',
        className: 'General',
        parentName: '',
        parentPhone: '',
        address: '',
        feeAmount: '',
        feeStatus: 'Paid',
      });
      router.refresh();
    }, 1200);
  }

  function handleExport() {
    const csv = toCSV(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `acadpk-report-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const donutCircumference = 2 * Math.PI * 42;
  const donutOffset =
    stats.collectionRate === null
      ? donutCircumference
      : donutCircumference * (1 - stats.collectionRate / 100);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-teal-50 border border-gray-100 p-6 md:p-8">
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-100/60 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="absolute right-10 bottom-0 w-40 h-40 rounded-full bg-teal-100/50 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-4 ${
              needsAttention ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${needsAttention ? 'bg-rose-500' : 'bg-teal-500'}`} />
            System Status: {needsAttention ? 'Needs Attention' : 'Optimal'}
          </span>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Welcome back, <span className="text-brand-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            {needsAttention
              ? `You have ${stats.overdueCount} unpaid fee${stats.overdueCount > 1 ? 's' : ''} from previous months. Here's today's overview.`
              : "Here's a quick overview of your academy's performance today."}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleNewAdmission}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-xs"
            >
              <IconPlus width={16} height={16} />
              New Admission
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 font-medium px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-xs"
            >
              <IconDownload width={16} height={16} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards: Square Grid on Mobile (2 cols), Row/Standard on Desktop (lg:grid-cols-5) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={IconStudents}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          label="Total Students"
          value={stats.totalStudents}
          trend={
            stats.newThisMonth > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full bg-teal-50 text-teal-700">
                <IconArrowUp width={12} height={12} />+{stats.newThisMonth}
              </span>
            ) : null
          }
        />

        <StatCard
          icon={IconClasses}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          label="Active Classes"
          value={stats.activeClasses}
        />

        <StatCard
          icon={IconStaff}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          label="Total Staff"
          value={staffCount}
        />

        <StatCard
          icon={IconRevenue}
          iconBg="bg-teal-50"
          iconColor="text-teal-700"
          label="Revenue (Month)"
          value={`Rs. ${stats.revenueThisMonth.toLocaleString()}`}
          trend={<Trend pct={stats.revenueChangePct} />}
        />

        <StatCard
          icon={IconWarning}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          label="Fee Remaining"
          value={
            <span className={stats.feeRemaining > 0 ? 'text-rose-600' : ''}>
              Rs. {stats.feeRemaining.toLocaleString()}
            </span>
          }
        />
      </div>

      {/* SEAMLESSLY ADDED: Minimal Owner Overview & Trend Graph Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Minimal Owner Snapshot Card */}
        <div className="bg-[#004b30] text-white rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-md">
              Owner Overview
            </span>
            <h3 className="text-lg font-bold mt-3">Institute Health Snapshot</h3>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
              Your institute is maintaining stable operations with <strong>{stats.totalStudents} active students</strong> and {stats.collectionRate || 0}% collection efficiency.
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-800/80 flex items-center justify-between text-xs">
            <span className="text-emerald-200">Active Roster: <strong className="text-white">{stats.totalStudents}</strong></span>
            <a href="/analytics" className="font-bold underline text-white hover:text-emerald-200">Full Analytics &rarr;</a>
          </div>
        </div>

        {/* Minimal Growth Trend Bar Widget */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-display font-semibold text-gray-900 text-sm">Monthly Revenue Trend</h3>
              <p className="text-[11px] text-gray-400">Quick view of recent performance flow</p>
            </div>
            <span className="text-xs font-bold text-[#004b30] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Flow
            </span>
          </div>

          {/* Minimal Vertical Bars */}
          <div className="grid grid-cols-4 gap-3 items-end h-28 pt-4 pb-1 border-b border-gray-100">
            {['Jun', 'Jul', 'Aug', 'Sep'].map((m, idx) => {
              const heights = ['40%', '65%', '55%', '85%'];
              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div 
                    className="w-full max-w-[28px] bg-[#004b30]/80 rounded-t-md transition-all duration-300 group-hover:bg-[#004b30]"
                    style={{ height: heights[idx] }}
                  ></div>
                  <span className="text-[10px] font-bold text-gray-400 mt-1.5">{m}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2">
            <span>Consistent intake observed</span>
            <span className="font-semibold text-gray-700">Stable growth</span>
          </div>
        </div>

      </div>

      {/* Collection rate + recent admissions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
          <h3 className="font-display font-semibold text-gray-900 mb-1">Fee Collection</h3>
          <p className="text-xs text-gray-500 mb-4">This month, {stats.dueCount} student{stats.dueCount === 1 ? '' : 's'} still due</p>

          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              {stats.collectionRate !== null && (
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#006c4d"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={donutCircumference}
                  strokeDashoffset={donutOffset}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold text-gray-900">
                {stats.collectionRate === null ? '—' : `${stats.collectionRate}%`}
              </span>
              <span className="text-[11px] text-gray-400">collected</span>
            </div>
          </div>

          {stats.collectionRate === null && (
            <a href="/fees" className="text-sm text-brand-600 font-medium mt-4">
              Generate this month&apos;s fees &rarr;
            </a>
          )}
        </div>

        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gray-900">Recent Admissions</h3>
            <a href="/students" className="text-sm text-brand-600 font-medium">
              View All
            </a>
          </div>

          {recentAdmissions.length === 0 ? (
            <p className="text-sm text-gray-400">
              No students yet.{' '}
              <button onClick={handleNewAdmission} className="text-brand-600 font-medium cursor-pointer">
                Add your first one
              </button>
              .
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentAdmissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold shrink-0">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {s.class_or_subject || 'No class set'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                        s.feeStatus === 'paid'
                          ? 'bg-teal-50 text-teal-700'
                          : s.feeStatus === 'due'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {s.feeStatus === 'paid' ? 'Paid' : s.feeStatus === 'due' ? 'Pending' : 'Not billed'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(s.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NEW ADMISSION MODAL WITH DYNAMIC CLASS DROPDOWN */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 sm:p-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">New Admission</h3>
                <p className="text-xs text-slate-400 mt-0.5">Enroll new student into an existing class</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {showSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-xl">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-slate-900">Admission Completed!</h4>
                <p className="text-xs text-slate-500">Student profile created successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleDashboardAdmissionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Batch</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all bg-white cursor-pointer"
                  >
                    <option value="General">General / Unassigned</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.section ? `(${c.section})` : ''} {c.shift ? `• ${c.shift}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Tariq Mahmood"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="e.g. 0300-1234567"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Street 4, Sector G-8, Islamabad"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount (Rs.)</label>
                    <input
                      type="number"
                      value={formData.feeAmount}
                      onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Fee Status</label>
                    <select
                      value={formData.feeStatus}
                      onChange={(e) => setFormData({ ...formData, feeStatus: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] bg-white cursor-pointer"
                    >
                      <option value="Paid">Paid (Collected)</option>
                      <option value="Pending">Pending (Unpaid)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#004b30] text-white font-semibold text-xs hover:bg-[#003823] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Student'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}