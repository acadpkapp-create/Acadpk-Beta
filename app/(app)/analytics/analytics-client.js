'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7); // "2026-10"
}

export default function AnalyticsClient({ instituteId, instituteName }) {
  const supabase = createClient();

  const [month, setMonth] = useState(currentMonthStr());
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!instituteId) return;
      setLoading(true);

      const [stRes, clRes, sfRes, feRes] = await Promise.all([
        supabase.from('students').select('*').eq('institute_id', instituteId),
        supabase.from('classes').select('*').eq('institute_id', instituteId),
        supabase.from('staff').select('*').eq('institute_id', instituteId),
        supabase.from('fees').select('*').eq('academy_id', instituteId).eq('fee_month', month),
      ]);

      setStudents(stRes.data || []);
      setClasses(clRes.data || []);
      setStaff(sfRes.data || []);
      setFees(feRes.data || []);
      setLoading(false);
    }

    fetchAnalytics();
  }, [instituteId, month]);

  // Aggregate Metrics for Selected Month
  const totalStudents = students.length;
  const activeBatches = classes.length;
  const totalStaffCount = staff.length;

  const totalCollectedMonth = fees
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const totalPendingMonth = fees
    .filter(f => f.status === 'due')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  // Class distribution count
  const classBreakdown = classes.map(c => {
    const count = students.filter(s => s.class_name?.toLowerCase() === c.name?.toLowerCase()).length;
    return { name: c.name, count, shift: c.shift || 'General' };
  });

  // Print Analytics Report for Selected Month
  function handlePrintAnalytics() {
    const batchRowsHtml = classBreakdown.length === 0 
      ? '<tr><td colspan="2">No classes configured</td></tr>' 
      : classBreakdown.map(cb => `<tr><td>${cb.name} (${cb.shift})</td><td><b>${cb.count}</b> Students</td></tr>`).join('');

    const staffRowsHtml = staff.length === 0 
      ? '<tr><td colspan="2">No staff recorded</td></tr>' 
      : staff.map(st => `<tr><td>${st.full_name} (${st.role || 'Teacher'})</td><td>PKR ${Number(st.salary || 0).toLocaleString()}</td></tr>`).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Growth & Analytics Report - ${instituteName} (${month})</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; background: #fff; }
            .report { border: 2px solid #004b30; border-radius: 16px; padding: 35px; max-width: 750px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { color: #004b30; margin: 0; font-size: 22px; }
            .badge { background: #e6f4ea; color: #004b30; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
            .card { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .card p { margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .card h3 { margin: 5px 0 0; font-size: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f1f5f9; color: #475569; }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div>
                <h1>${instituteName}</h1>
                <p>Monthly Performance & Analytics Overview</p>
              </div>
              <div class="badge">Period: ${month}</div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <p>Total Enrolled Students</p>
                <h3 style="color: #0f172a;">${totalStudents}</h3>
              </div>
              <div class="card">
                <p>Active Batches / Classes</p>
                <h3 style="color: #0f172a;">${activeBatches}</h3>
              </div>
              <div class="card">
                <p>Revenue Collected (${month})</p>
                <h3 style="color: #006c4d;">PKR ${totalCollectedMonth.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Pending Dues (${month})</p>
                <h3 style="color: #dc2626;">PKR ${totalPendingMonth.toLocaleString()}</h3>
              </div>
            </div>

            <h3 style="font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px;">Batch Enrollment Breakdown</h3>
            <table>
              <thead><tr><th>Class / Batch</th><th>Headcount</th></tr></thead>
              <tbody>${batchRowsHtml}</tbody>
            </table>

            <h3 style="font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px;">Staff & Faculty Roster</h3>
            <table>
              <thead><tr><th>Staff Member & Role</th><th>Monthly Salary</th></tr></thead>
              <tbody>${staffRowsHtml}</tbody>
            </table>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-container-max mx-auto w-full space-y-6 bg-background min-h-screen text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Growth & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monthly statistics and revenue performance &middot; <span className="text-[#006c4d] font-semibold">{instituteName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrintAnalytics}
            className="px-4 py-2.5 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Analytics Report
          </button>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <label className="text-xs font-bold text-slate-600 uppercase">Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs font-semibold outline-none bg-transparent text-slate-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium">Crunching your institute data...</div>
      ) : (
        <>
          {/* Top KPI Grid (Square Grid on Mobile: grid-cols-2) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Total Enrolled Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{totalStudents}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-1">Active roster count</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Active Batches / Classes</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{activeBatches}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">Configured shifts</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Revenue Collected ({month})</p>
              <p className="text-xl sm:text-3xl font-bold text-[#006c4d] mt-1">PKR {totalCollectedMonth.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-[#006c4d] font-medium mt-1">Cleared fee records</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Pending Dues ({month})</p>
              <p className="text-xl sm:text-3xl font-bold text-rose-600 mt-1">PKR {totalPendingMonth.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-rose-500 font-medium mt-1">Outstanding collections</p>
            </div>
          </div>

          {/* Detailed Breakdown Sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Batch Enrollment Distribution */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Batch Enrollment Breakdown</h3>
              <p className="text-xs text-slate-500">Student headcount distribution across your active classes.</p>

              <div className="divide-y divide-slate-100">
                {classBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No classes configured yet.</p>
                ) : (
                  classBreakdown.map((cb, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3.5">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{cb.name}</p>
                        <p className="text-xs text-slate-400">{cb.shift}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-emerald-50 text-[#006c4d] px-3 py-1 rounded-full border border-emerald-200">
                          {cb.count} Students
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Institute Staff Summary */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Staff & Faculty Overview</h3>
              <p className="text-xs text-slate-500">Active teachers and administrative personnel roster.</p>

              <div className="divide-y divide-slate-100">
                {staff.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No staff members added yet.</p>
                ) : (
                  staff.map((st) => (
                    <div key={st.id} className="flex items-center justify-between py-3.5">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{st.full_name}</p>
                        <p className="text-xs text-slate-400">{st.role || 'Teacher'} &middot; {st.phone || 'No Phone'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">PKR {Number(st.salary || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">Monthly Salary</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}