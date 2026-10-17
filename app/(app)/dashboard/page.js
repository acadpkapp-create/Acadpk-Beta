'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7); // "2026-10"
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [institute, setInstitute] = useState({ id: null, name: 'Portal', type: 'School / College' });

  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    totalStaff: 0,
    monthRevenue: 0,
    feeRemaining: 0,
    collectionPercentage: 0,
  });
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [classesList, setClassesList] = useState([]);

  // New Admission Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    className: 'General',
    parentName: '',
    parentPhone: '',
    address: '',
    feeAmount: '',
    feeStatus: 'Paid',
  });

  // Export Report Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    reportType: 'students', 
    dateRange: 'all',        
    format: 'csv',          
  });

  // Clean Data Loader synchronized with the `fees` table for the current month
  async function loadRealData() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Fetch user institute without auto-creating fallback records
      let { data: instData } = await supabase
        .from('institutes')
        .select('id, name, type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!instData) {
        router.push('/onboarding');
        return;
      }

      setInstitute(instData);
      const currentMonth = currentMonthStr();

      // Fetch Classes list, Students, Month-specific Fees, and Staff count in parallel
      const [clsRes, studentRes, feeRes, staffRes] = await Promise.all([
        supabase.from('classes').select('*').eq('institute_id', instData.id).order('name', { ascending: true }),
        supabase.from('students').select('*').eq('institute_id', instData.id).order('created_at', { ascending: false }),
        supabase.from('fees').select('*').eq('fee_month', currentMonth),
        supabase.from('staff').select('id', { count: 'exact', head: true }).eq('institute_id', instData.id),
      ]);

      const classesData = clsRes.data || [];
      const studentsData = studentRes.data || [];
      const feesData = feeRes.data || [];
      const staffCount = staffRes.count || 0;

      if (classesData) setClassesList(classesData);

      const feeMap = {};
      feesData.forEach((f) => {
        feeMap[f.student_id] = f;
      });

      const totalStudentsCount = studentsData.length;
      let monthRevenue = 0;
      let feeRemaining = 0;
      let paidCount = 0;

      studentsData.forEach((st) => {
        const f = feeMap[st.id];
        if (f) {
          if (f.status === 'paid') {
            monthRevenue += Number(f.amount || 0);
            paidCount++;
          } else if (f.status === 'due') {
            feeRemaining += Number(f.amount || 0);
          }
        }
      });

      const collectionPercentage =
        totalStudentsCount > 0 ? Math.round((paidCount / totalStudentsCount) * 100) : 0;

      setStats({
        totalStudents: totalStudentsCount,
        activeClasses: classesData.length,
        totalStaff: staffCount,
        monthRevenue,
        feeRemaining,
        collectionPercentage,
      });

      setRecentAdmissions(
        studentsData.slice(0, 5).map((st) => {
          const f = feeMap[st.id];
          const status = f ? f.status : 'not_billed';
          return {
            id: st.id,
            name: st.full_name,
            detail: st.class_name ? `Class: ${st.class_name}` : `Roll #: ${st.roll_number || 'N/A'}`,
            status: status === 'paid' ? 'Paid' : status === 'due' ? 'Pending' : 'Not Billed',
            time: new Date(st.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            initials: st.full_name
              ? st.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'ST',
          };
        })
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRealData();
  }, []);

  async function handleAddAdmissionSubmit(e) {
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

    const { count: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('institute_id', institute.id);

    const nextNumber = (studentCount || 0) + 1;
    const autoRollNumber = `ADM-${String(nextNumber).padStart(4, '0')}`;

    const { error } = await supabase.from('students').insert([
      {
        user_id: user.id,
        institute_id: institute.id,
        full_name: formData.fullName.trim(),
        class_name: formData.className.trim() || 'General',
        parent_name: formData.parentName.trim() || null,
        parent_phone: formData.parentPhone.trim() || null,
        address: formData.address.trim() || null,
        fee_amount: Number(formData.feeAmount) || 5000,
        fee_status: 'Pending',
        roll_number: autoRollNumber,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error('Student Save Error:', error);
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
      loadRealData();
    }, 1200);
  }

  const handleExecuteExport = async () => {
    setExporting(true);
    const supabase = createClient();

    let query = supabase
      .from('students')
      .select('roll_number, full_name, class_name, parent_name, parent_phone, address, fee_amount, fee_status, created_at')
      .eq('institute_id', institute.id);

    const now = new Date();
    if (exportConfig.dateRange === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('created_at', firstDay);
    } else if (exportConfig.dateRange === 'last_month') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
      query = query.gte('created_at', firstDayLastMonth).lte('created_at', lastDayLastMonth);
    } else if (exportConfig.dateRange === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
      query = query.gte('created_at', startOfYear);
    }

    const { data: reportData, error } = await query.order('created_at', { ascending: false });

    if (error || !reportData || reportData.length === 0) {
      alert('No matching records found for the selected options.');
      setExporting(false);
      return;
    }

    if (exportConfig.format === 'print') {
      const printWindow = window.open('', '_blank');
      const tableRows = reportData.map(s => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${s.roll_number || 'N/A'}</td>
          <td style="padding:8px;border:1px solid #ddd;"><strong>${s.full_name}</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${s.class_name || 'General'}</td>
          <td style="padding:8px;border:1px solid #ddd;">${s.parent_phone || 'N/A'}</td>
          <td style="padding:8px;border:1px solid #ddd;">Rs. ${s.fee_amount || 0}</td>
          <td style="padding:8px;border:1px solid #ddd;">${s.fee_status}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>${institute.name} - Report</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              h2 { margin-bottom: 4px; color: #004b30; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
              th { background: #004b30; color: white; padding: 10px; text-align: left; }
            </style>
          </head>
          <body>
            <h2>${institute.name}</h2>
            <p style="font-size: 12px; color: #666;">Report Type: ${exportConfig.reportType.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Roll #</th>
                  <th>Student Name</th>
                  <th>Class / Batch</th>
                  <th>Contact</th>
                  <th>Fee (Rs.)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      const headers = ['Roll #,Full Name,Class / Batch,Parent Name,Phone,Address,Fee Amount,Fee Status,Date\n'];
      const rows = reportData.map(s => 
        `"${s.roll_number || 'N/A'}","${s.full_name}","${s.class_name || 'General'}","${s.parent_name || 'N/A'}","${s.parent_phone || 'N/A'}","${s.address || 'N/A'}",${s.fee_amount || 0},"${s.fee_status}",${new Date(s.created_at).toLocaleDateString()}`
      );

      const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${institute.name.replace(/\s+/g, '_')}_${exportConfig.reportType}_report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    setExporting(false);
    setExportModalOpen(false);
  };

  const isSchool = institute.type === 'School / College';
  const groupLabel = isSchool
    ? 'Active Classes'
    : institute.type === 'Quran Academy / Hifz'
    ? 'Active Halqas'
    : 'Active Batches';
  const strokeDashoffset = 283 - 283 * (stats.collectionPercentage / 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-container-max mx-auto w-full space-y-6 sm:space-y-8 bg-background min-h-screen text-on-background">
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[220px] flex items-center p-5 sm:p-8 lg:p-10 border border-slate-200/80 bg-white shadow-xs">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-emerald-50/50 via-white to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c4d] border border-emerald-200/80 mb-3 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Status: Optimal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Welcome back, <span className="text-[#006c4d]">{institute.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-xl leading-relaxed">
            Here's a quick overview of your institute's performance today. Stay on top of enrollments and fee collection.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 bg-[#004b30] text-white rounded-xl font-semibold text-sm hover:bg-[#003823] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Admission</span>
            </button>

            <button
              onClick={() => setExportModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stat cards: 2 columns on mobile, 5 columns on desktop with full comfortable padding and fonts */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div
          onClick={() => router.push('/students')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006c4d]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006c4d] group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6 0 3.375 3.375 0 016 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-[#006c4d] bg-emerald-50 uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-200">
                Live
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalStudents.toLocaleString()}</p>
        </div>

        <div
          onClick={() => router.push('/classes')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006c4d]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{groupLabel}</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.activeClasses}</p>
        </div>

        <div
          onClick={() => router.push('/staff')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006c4d]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Staff</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalStaff}</p>
        </div>

        <div
          onClick={() => router.push('/fees?filter=paid')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006c4d]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5zM3 10.5h18" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Revenue (Month)</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate mt-2">
            {loading ? '...' : `Rs. ${stats.monthRevenue.toLocaleString()}`}
          </p>
        </div>

        <div
          onClick={() => router.push('/fees?filter=due')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-rose-200 shadow-xs hover:shadow-md hover:border-rose-400 transition-all cursor-pointer group flex flex-col justify-between col-span-2 lg:col-span-1"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1">Fee Remaining</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 truncate mt-2">
            {loading ? '...' : `Rs. ${stats.feeRemaining.toLocaleString()}`}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-slate-200/80 shadow-xs">
          <div className="relative z-10 w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Fee Collection</h3>
            <p className="text-xs text-slate-400 mb-6">Target collection progress</p>

            <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-slate-100" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8" />
                <circle
                  className="text-[#006c4d] transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-[#006c4d]">{stats.collectionPercentage}%</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Collected</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/fees')}
              className="text-xs sm:text-sm font-semibold text-[#006c4d] hover:underline flex items-center justify-center w-full gap-1 cursor-pointer"
            >
              Generate Fee Vouchers →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 lg:col-span-2 flex flex-col border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent Admissions</h3>
            <button
              onClick={() => router.push('/students')}
              className="text-xs sm:text-sm font-semibold text-[#006c4d] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {recentAdmissions.length === 0 ? (
            <div className="my-auto py-12 text-center text-slate-400 text-sm">
              No real students found in your database yet.
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2.5 sm:gap-3">
              {recentAdmissions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push('/students')}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-xs sm:text-sm">
                      {item.initials}
                    </div>
                    <div className="truncate">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.detail}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                        item.status === 'Paid'
                          ? 'bg-emerald-50 text-[#006c4d] border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 sm:p-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">New Admission</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enrolling new student to {institute.name} ({institute.type})
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {showSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900">Admission Completed!</h4>
                <p className="text-xs text-slate-500 max-w-xs">Student profile created successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleAddAdmissionSubmit} className="space-y-4">
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount (Rs.)</label>
                    <input
                      type="number"
                      value={formData.feeAmount}
                      onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Fee Status</label>
                    <select
                      value={formData.feeStatus}
                      onChange={(e) => setFormData({ ...formData, feeStatus: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all bg-white cursor-pointer"
                    >
                      <option value="Paid">Paid (Collected)</option>
                      <option value="Pending">Pending (Unpaid)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Tariq Mahmood"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="e.g. 0300-1234567"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                  />
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

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Export Report</h3>
                <p className="text-xs text-slate-400">Customize report filters and download format</p>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Report Category</label>
                <select
                  value={exportConfig.reportType}
                  onChange={(e) => setExportConfig({ ...exportConfig, reportType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] bg-white"
                >
                  <option value="students">Full Student Roster (All Data)</option>
                  <option value="financial">Fee Collection & Revenue Statement</option>
                  <option value="defaulters">Unpaid Dues / Defaulters List Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Duration</label>
                <select
                  value={exportConfig.dateRange}
                  onChange={(e) => setExportConfig({ ...exportConfig, dateRange: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] bg-white"
                >
                  <option value="all">All Time (Complete History)</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Output Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportConfig({ ...exportConfig, format: 'csv' })}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      exportConfig.format === 'csv'
                        ? 'border-[#006c4d] bg-emerald-50 text-[#006c4d]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    CSV Spreadsheet (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportConfig({ ...exportConfig, format: 'print' })}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      exportConfig.format === 'print'
                        ? 'border-[#006c4d] bg-emerald-50 text-[#006c4d]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Print / PDF Document
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteExport}
                  disabled={exporting}
                  className="px-6 py-2.5 rounded-xl bg-[#004b30] text-white font-semibold text-xs hover:bg-[#003823] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  {exporting ? 'Generating...' : 'Download Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}