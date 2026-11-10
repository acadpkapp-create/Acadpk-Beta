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
  const [institute, setInstitute] = useState({ 
    id: null, 
    name: 'Portal', 
    type: 'School / College',
    phone: '',
    email: '',
    address: '',
    tagline: '',
    logo_url: '',
    stamp_url: ''
  });

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

  // New Admission Modal State with All Fields Included
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',          // 1. Students Full Name (Required)
    dateOfBirth: '',       // 2. Date of Birth (Optional)
    guardianName: '',      // 3. Fathers/Guardian Full Name (Required)
    guardianOccupation: '',// 4. Fathers/Guardian Occupation (Optional)
    parentPhone: '',       // Parent / Guardian Contact Phone
    residentialAddress: '',// 5. Residential Address (Optional)
    admissionYear: '',     // 6. Year of Admission (Optional)
    admissionClass: '',    // 7. Class at admission (Optional)
    currentClass: 'General',// 8. Current Class (Required)
    feeAmount: '',
    feeStatus: 'Paid',
  });

  // Export Report Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    reportType: 'students', 
    dateRange: 'all',        
    format: 'csv',
    selectedClass: 'all',    
  });

  // Clean Data Loader (Including all Institute Profile & PDF header fields)
  async function loadRealData() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      let { data: instData } = await supabase
        .from('institutes')
        .select('id, name, type, phone, email, address, tagline, logo_url, stamp_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!instData) {
        router.push('/onboarding');
        return;
      }

      setInstitute(instData);
      const currentMonth = currentMonthStr();

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
        const effectiveAmount = Number(f?.amount ?? st.fee_amount ?? 5000);

        if (f) {
          if (f.status === 'paid') {
            monthRevenue += effectiveAmount;
            paidCount++;
          } else if (f.status === 'due') {
            feeRemaining += effectiveAmount;
          }
        } else {
          feeRemaining += Number(st.fee_amount || 5000);
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
    
    if (!formData.fullName || !formData.fullName.trim()) {
      alert('Please enter a valid student full name.');
      return;
    }
    if (!formData.guardianName || !formData.guardianName.trim()) {
      alert("Please enter Father's / Guardian's full name.");
      return;
    }
    if (!formData.currentClass || !formData.currentClass.trim()) {
      alert('Please select or specify the current class.');
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
        date_of_birth: formData.dateOfBirth || null,         
        guardian_name: formData.guardianName.trim(),         
        guardian_occupation: formData.guardianOccupation.trim() || null, 
        parent_phone: formData.parentPhone.trim() || null,   
        residential_address: formData.residentialAddress.trim() || null, 
        admission_year: formData.admissionYear.trim() || null,   
        admission_class: formData.admissionClass.trim() || null, 
        class_name: formData.currentClass.trim(),                
        fee_amount: formData.feeAmount === '' ? 0 : Number(formData.feeAmount),
        fee_status: formData.feeStatus,
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
        dateOfBirth: '',
        guardianName: '',
        guardianOccupation: '',
        parentPhone: '',
        residentialAddress: '',
        admissionYear: '',
        admissionClass: '',
        currentClass: 'General',
        feeAmount: '',
        feeStatus: 'Paid',
      });
      loadRealData();
    }, 1200);
  }

  const handleExecuteExport = async () => {
    setExporting(true);
    const supabase = createClient();
    const currentMonth = currentMonthStr();

    let query = supabase
      .from('students')
      .select('id, roll_number, full_name, class_name, guardian_name, parent_phone, residential_address, fee_amount, created_at')
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

    const { data: studentsData, error } = await query.order('created_at', { ascending: false });

    if (error || !studentsData || studentsData.length === 0) {
      alert('No matching records found for the selected options.');
      setExporting(false);
      return;
    }

    const { data: feesData } = await supabase
      .from('fees')
      .select('student_id, status, amount')
      .eq('fee_month', currentMonth);

    const feeStatusMap = {};
    if (feesData) {
      feesData.forEach(f => {
        feeStatusMap[f.student_id] = f.status === 'paid' ? 'Paid' : 'Pending';
      });
    }

    let reportData = studentsData.map(s => ({
      ...s,
      fee_status: feeStatusMap[s.id] || 'Paid'
    }));

    if (exportConfig.reportType === 'defaulters') {
      reportData = reportData.filter(s => s.fee_status === 'Pending');
    }

    if (reportData.length === 0) {
      alert('No records found matching the selected fee status filter.');
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
          <td style="padding:8px;border:1px solid #ddd;">${s.guardian_name || 'N/A'} (${s.parent_phone || 'No Phone'})</td>
          <td style="padding:8px;border:1px solid #ddd;">Rs. ${s.fee_amount || 0}</td>
          <td style="padding:8px;border:1px solid #ddd; color: ${s.fee_status === 'Paid' ? '#006c4d' : '#e11d48'}; font-weight:bold;">${s.fee_status}</td>
        </tr>
      `).join('');

      // Build contact details dynamically based on what the owner filled out
      const contactInfo = [
        institute.phone ? `Phone: ${institute.phone}` : '',
        institute.email ? `Email: ${institute.email}` : '',
        institute.address ? `Address: ${institute.address}` : ''
      ].filter(Boolean).join(' | ');

      printWindow.document.write(`
        <html>
          <head>
            <title>${institute.name} - Report</title>
            <style>
              body { font-family: sans-serif; padding: 25px; color: #333; }
              .pdf-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #004b30; padding-bottom: 12px; margin-bottom: 20px; }
              .logo-title { display: flex; align-items: center; gap: 15px; }
              .pdf-logo { max-height: 55px; max-width: 55px; object-fit: contain; border-radius: 6px; }
              h2 { margin: 0; color: #004b30; font-size: 22px; }
              .tagline { font-style: italic; font-size: 11px; color: #555; margin: 2px 0; }
              .meta { font-size: 11px; color: #666; margin-top: 3px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
              th { background: #004b30; color: white; padding: 10px; text-align: left; }
              .pdf-footer { margin-top: 40px; display: flex; justify-content: flex-end; align-items: center; }
              .stamp-img { max-height: 70px; object-fit: contain; }
            </style>
          </head>
          <body>
            <div class="pdf-header">
              <div class="logo-title">
                ${institute.logo_url ? `<img src="${institute.logo_url}" class="pdf-logo" />` : ''}
                <div>
                  <h2>${institute.name}</h2>
                  ${institute.tagline ? `<div class="tagline">${institute.tagline}</div>` : ''}
                  ${contactInfo ? `<div class="meta">${contactInfo}</div>` : ''}
                </div>
              </div>
              <div style="text-align: right; font-size: 11px; color: #666;">
                <strong>Report:</strong> ${exportConfig.reportType.toUpperCase()}<br/>
                <strong>Date:</strong> ${new Date().toLocaleDateString()}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Roll #</th>
                  <th>Student Name</th>
                  <th>Current Class</th>
                  <th>Guardian & Contact</th>
                  <th>Fee (Rs.)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>

            ${institute.stamp_url ? `
              <div class="pdf-footer">
                <div style="text-align: center;">
                  <img src="${institute.stamp_url}" class="stamp-img" />
                  <div style="font-size: 10px; color: #666; margin-top: 2px; border-top: 1px solid #ccc; pt: 2px;">Authorized Stamp</div>
                </div>
              </div>
            ` : ''}

            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      const headers = ['Roll #,Full Name,Current Class,Guardian Name,Contact Phone,Address,Fee Amount,Fee Status,Date\n'];
      const rows = reportData.map(s => 
        `"${s.roll_number || 'N/A'}","${s.full_name}","${s.class_name || 'General'}","${s.guardian_name || 'N/A'}","${s.parent_phone || 'N/A'}","${s.residential_address || 'N/A'}",${s.fee_amount || 0},"${s.fee_status}",${new Date(s.created_at).toLocaleDateString()}`
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
  const groupLabel = isSchool ? 'Active Classes' : 'Active Batches';
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

          {/* MINIMAL RESPONSIVE WELCOME HEADER WITH LOGO BADGE */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-3 flex-wrap">
            {institute.logo_url && (
              <img 
                src={institute.logo_url} 
                alt="Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 p-0.5" 
              />
            )}
            <span>Welcome back, <span className="text-[#006c4d]">{institute.name}</span></span>
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

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div onClick={() => router.push('/students')} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalStudents.toLocaleString()}</p>
        </div>
        <div onClick={() => router.push('/students')} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{groupLabel}</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.activeClasses}</p>
        </div>
        <div onClick={() => router.push('/staff')} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Staff</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalStaff}</p>
        </div>
        <div onClick={() => router.push('/fees?filter=paid')} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fee Collected (Month)</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate mt-2">{loading ? '...' : `Rs. ${stats.monthRevenue.toLocaleString()}`}</p>
        </div>
        <div onClick={() => router.push('/fees?filter=due')} className="bg-white rounded-2xl p-5 sm:p-6 border border-rose-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1">Fee Remaining</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 truncate mt-2">{loading ? '...' : `Rs. ${stats.feeRemaining.toLocaleString()}`}</p>
        </div>
      </section>

      {/* OWNER SPOTLIGHT CARD WITH PARAGRAPH STATEMENT */}
      <section className="bg-[#004b30] text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
        <div className="inline-block px-3 py-1 rounded-full bg-[#003823] text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
          Owner Spotlight
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
          {currentMonthStr()} Overview
        </h3>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed">
          Your institute recorded an active headcount of <strong className="text-white">{stats.totalStudents} students</strong> across <strong className="text-white">{stats.activeClasses} active batches</strong> during this period, supported by <strong className="text-white">{stats.totalStaff} staff members</strong>. Current operations reflect a fee collection efficiency of <strong className="text-emerald-300">{stats.collectionPercentage}%</strong> with <strong className="text-rose-300">PKR {stats.feeRemaining.toLocaleString()}</strong> in pending dues remaining.
        </p>
      </section>

      {/* COLLECTION RATE & RECENT ADMISSIONS SECTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-slate-200/80 shadow-xs">
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

      {/* NEW ADMISSION MODAL WITH 8 FIELDS + CONTACT PHONE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl p-6 sm:p-8 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">New Student Admission</h3>
                <p className="text-xs text-slate-400 mt-0.5">Enter complete official student credentials</p>
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
                <p className="text-xs text-slate-500">Student profile registered successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleAddAdmissionSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">1. Student's Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">2. Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">6. Year of Admission</label>
                    <input
                      type="text"
                      value={formData.admissionYear}
                      onChange={(e) => setFormData({ ...formData, admissionYear: e.target.value })}
                      placeholder="e.g. 2026"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">3. Father's / Guardian Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      placeholder="e.g. Tariq Mahmood"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">4. Father's / Guardian Occupation</label>
                    <input
                      type="text"
                      value={formData.guardianOccupation}
                      onChange={(e) => setFormData({ ...formData, guardianOccupation: e.target.value })}
                      placeholder="e.g. Engineer / Businessman"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="e.g. 0300-1234567"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">5. Residential Address</label>
                    <input
                      type="text"
                      value={formData.residentialAddress}
                      onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                      placeholder="e.g. House 12, Street 4, Islamabad"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">7. Class at Time of Admission</label>
                    <input
                      type="text"
                      value={formData.admissionClass}
                      onChange={(e) => setFormData({ ...formData, admissionClass: e.target.value })}
                      placeholder="e.g. 9th Grade"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">8. Current Class *</label>
                    <select
                      value={formData.currentClass}
                      onChange={(e) => setFormData({ ...formData, currentClass: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] bg-white cursor-pointer"
                    >
                      <option value="General">General / Unassigned</option>
                      {classesList.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.section ? `(${c.section})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Fee Amount (Rs.)</label>
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

                <div className="pt-4 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2 border-t border-slate-100">
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

      {/* EXPORT MODAL */}
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
                ✕
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