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
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Duration filter state for Multi-Month Summary (Default: Last 6 Months)
  const [summaryDuration, setSummaryDuration] = useState('6');

  useEffect(() => {
    async function fetchAnalytics() {
      if (!instituteId) return;
      setLoading(true);

      // Fetch all core tables with strict academy_id / institute_id guard
      const [stRes, clRes, sfRes, feRes, exRes] = await Promise.all([
        supabase.from('students').select('*').eq('institute_id', instituteId),
        supabase.from('classes').select('*').eq('institute_id', instituteId),
        supabase.from('staff').select('*').eq('institute_id', instituteId),
        supabase.from('fees').select('*').eq('academy_id', instituteId).not('academy_id', 'is', null),
        supabase.from('expenses').select('*').eq('institute_id', instituteId),
      ]);

      setStudents(stRes.data || []);
      setClasses(clRes.data || []);
      setStaff(sfRes.data || []);
      setFees(feRes.data || []);
      setExpenses(exRes.data || []);
      setLoading(false);
    }

    fetchAnalytics();
  }, [instituteId]);

  // Map active month fees for the top inspector strictly matching selected month
  const feeMap = {};
  fees.filter(f => f.fee_month === month).forEach((f) => {
    feeMap[f.student_id] = f;
  });

  // Enrolled for selected inspection month
  const enrolledForMonth = students.filter(s => {
    if (!s.created_at) return true;
    return s.created_at.slice(0, 7) <= month;
  });

  const totalStudents = enrolledForMonth.length;
  const activeBatches = classes.length;
  const totalStaffCount = staff.length;

  // Selected Month Financials (Top Inspector)
  let totalCollectedMonth = 0;
  let totalPendingMonth = 0;

  enrolledForMonth.forEach((st) => {
    const f = feeMap[st.id];
    if (f && f.status === 'paid') {
      totalCollectedMonth += Number(f.amount || 0);
    } else if (f && f.status === 'due') {
      totalPendingMonth += Number(f.amount || st.fee_amount || 5000);
    } else if (!f) {
      totalPendingMonth += Number(st.fee_amount || 5000);
    }
  });

  const totalStaffSalaries = staff.reduce((sum, s) => sum + Number(s.salary || 0), 0);

  const monthCustomExpenses = expenses
    .filter(e => {
      const expDate = e.expense_date || e.created_at;
      return expDate && expDate.startsWith(month);
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalExpensesMonth = totalStaffSalaries + monthCustomExpenses;
  const netProfitMonth = totalCollectedMonth - totalExpensesMonth;

  const classBreakdown = classes.map(c => {
    const count = enrolledForMonth.filter(s => s.class_name?.toLowerCase() === c.name?.toLowerCase()).length;
    return { name: c.name, count, shift: c.shift || 'General' };
  });

  // --- STRICT CUMULATIVE SUMMARY CALCULATIONS ---
  function getPastMonthsTimeline(targetMonthStr, count) {
    const months = [];
    const [year, mNum] = targetMonthStr.split('-').map(Number);
    const currDate = new Date(year, mNum - 1, 1);

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(currDate.getFullYear(), currDate.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(mStr);
    }
    return months;
  }

  const durationLimit = parseInt(summaryDuration, 10) || 6;
  const targetTimelineMonths = getPastMonthsTimeline(month, durationLimit);

  let cumulativeRevenue = 0;
  let cumulativeExpenses = 0;
  let cumulativePendingDues = 0;
  let peakHeadcount = 0;

  targetTimelineMonths.forEach(m => {
    // 1. Strict Paid Revenue: ONLY fee rows where fee_month matches month 'm' and status is 'paid'
    const mRev = fees
      .filter(f => f.fee_month === m && f.status === 'paid')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    cumulativeRevenue += mRev;

    // 2. Strict Pending Dues: ONLY fee rows where fee_month matches month 'm' and status is 'due'
    const mPending = fees
      .filter(f => f.fee_month === m && f.status === 'due')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    cumulativePendingDues += mPending;

    // 3. Staff salaries for month 'm' (only if staff existed by month m)
    const activeStaffInM = staff.filter(s => !s.created_at || s.created_at.slice(0, 7) <= m);
    const mSalaries = activeStaffInM.reduce((sum, s) => {
      if (s.created_at && s.created_at.slice(0, 7) > m) return sum;
      return sum + Number(s.salary || 0);
    }, 0);

    // 4. Custom expenses logged in month 'm'
    const mCustomExp = expenses
      .filter(e => {
        const dStr = e.expense_date || e.created_at;
        return dStr && dStr.startsWith(m);
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 5. Headcount in month 'm'
    const mHeadcount = students.filter(s => !s.created_at || s.created_at.slice(0, 7) <= m).length;
    if (mHeadcount > peakHeadcount) {
      peakHeadcount = mHeadcount;
    }

    // Only add expenses for months where actual activity (revenue, expenses, or students) existed
    if (mRev > 0 || mCustomExp > 0 || mHeadcount > 0) {
      cumulativeExpenses += (mSalaries + mCustomExp);
    }
  });

  const cumulativeProfit = cumulativeRevenue - cumulativeExpenses;
  const maxCumulativeCashflow = Math.max(cumulativeRevenue, cumulativeExpenses, 1);
  const cumulativeRevPercent = Math.min(100, (cumulativeRevenue / maxCumulativeCashflow) * 100);
  const cumulativeExpPercent = Math.min(100, (cumulativeExpenses / maxCumulativeCashflow) * 100);

  // Print Reports
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
                <h3>${totalStudents}</h3>
              </div>
              <div class="card">
                <p>Revenue Collected (${month})</p>
                <h3 style="color: #006c4d;">PKR ${totalCollectedMonth.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Total Expenses (Salaries + Bills)</p>
                <h3 style="color: #dc2626;">PKR ${totalExpensesMonth.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Net Profit (${month})</p>
                <h3 style="color: #004b30;">PKR ${netProfitMonth.toLocaleString()}</h3>
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

  function handlePrintMultiMonthSummary() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Collected Performance Summary - ${instituteName}</title>
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
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div>
                <h1>${instituteName}</h1>
                <p>Collected Multi-Month Financial Summary</p>
              </div>
              <div class="badge">Duration: Last ${summaryDuration} Months (Up to ${month})</div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <p>Total Cumulative Revenue</p>
                <h3 style="color: #006c4d;">PKR ${cumulativeRevenue.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Total Cumulative Expenses</p>
                <h3 style="color: #dc2626;">PKR ${cumulativeExpenses.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Net Collected Earnings</p>
                <h3 style="color: ${cumulativeProfit >= 0 ? '#004b30' : '#dc2626'};">PKR ${cumulativeProfit.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Total Uncollected Dues</p>
                <h3 style="color: #dc2626;">PKR ${cumulativePendingDues.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-container-max mx-auto w-full space-y-6 bg-background min-h-screen text-slate-900">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Growth & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Executive metrics, cashflow visual graphs &middot; <span className="text-[#006c4d] font-semibold">{instituteName}</span>
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
            Print Report
          </button>

          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <label className="text-xs font-bold text-slate-600 uppercase">MONTH:</label>
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
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">TOTAL STUDENTS ({month})</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{totalStudents}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-1">Enrolled for this period</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">REVENUE COLLECTED</p>
              <p className="text-xl sm:text-2xl font-bold text-[#006c4d] mt-1">PKR {totalCollectedMonth.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-[#006c4d] font-medium mt-1">For {month}</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">TOTAL EXPENSES</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">PKR {totalExpensesMonth.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-rose-500 font-medium mt-1">Salaries + Overhead</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs border-l-4 border-l-[#006c4d]">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">NET PROFIT</p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${netProfitMonth >= 0 ? 'text-[#006c4d]' : 'text-rose-600'}`}>
                PKR {netProfitMonth.toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">True monthly earnings</p>
            </div>
          </div>

          {/* VISUAL CASHFLOW & MONTHLY COMPARISON GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Horizontal Progress Bars */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cashflow & Profit Analysis</h3>
                  <p className="text-xs text-slate-500">Visual comparison of revenue collections against total operating expenses.</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#004b30]"></span> Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Expenses</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Revenue Collected</span>
                    <span className="text-[#006c4d]">PKR {totalCollectedMonth.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#004b30] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalCollectedMonth / (Math.max(totalCollectedMonth, totalExpensesMonth, 1))) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Operating Expenses (Salaries + Overhead)</span>
                    <span className="text-rose-600">PKR {totalExpensesMonth.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalExpensesMonth / (Math.max(totalCollectedMonth, totalExpensesMonth, 1))) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ESTIMATED PROFIT MARGIN:</span>
                  <span className="text-sm font-extrabold text-[#004b30]">
                    {totalCollectedMonth > 0 ? Math.round((netProfitMonth / totalCollectedMonth) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Highlight Card */}
            <div className="bg-[#004b30] text-white p-6 sm:p-8 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-md">
                  OWNER SPOTLIGHT
                </span>
                <h3 className="text-xl font-extrabold mt-3">{month} Overview</h3>
                <p className="text-xs text-emerald-100 mt-2 leading-relaxed">
                  Your institute recorded an active headcount of <strong>{totalStudents} students</strong> across <strong>{activeBatches} active batches</strong> during this period.
                </p>
              </div>

              <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-300">Pending Dues:</span>
                  <span className="font-bold text-rose-300">PKR {totalPendingMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-300">Total Staff Roster:</span>
                  <span className="font-bold text-white">{totalStaffCount} Members</span>
                </div>
              </div>
            </div>

          </div>

          {/* Detailed Breakdown Sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Batch Enrollment Distribution */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Batch Enrollment Breakdown ({month})</h3>
              <p className="text-xs text-slate-500">Student headcount distribution for selected month.</p>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
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
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Staff & Faculty Overview</h3>
              <p className="text-xs text-slate-500">Active teachers and administrative personnel roster.</p>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
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

          {/* MULTI-MONTH COLLECTED SUMMARY CARD */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Section Header & Duration Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Multi-Month Collected Summary & Trends</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cumulative financial totals strictly matching active database months ending at {month}.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <label className="text-xs font-bold text-slate-600 uppercase">DURATION:</label>
                  <select
                    value={summaryDuration}
                    onChange={(e) => setSummaryDuration(e.target.value)}
                    className="text-xs font-bold outline-none bg-transparent text-slate-800 cursor-pointer"
                  >
                    <option value="3">Last 3 Months</option>
                    <option value="6">Last 6 Months</option>
                    <option value="12">Last 12 Months</option>
                  </select>
                </div>

                <button
                  onClick={handlePrintMultiMonthSummary}
                  className="px-4 py-2.5 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Summary
                </button>
              </div>
            </div>

            {/* Collected Executive Summary Card */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[#004b30]/40 bg-emerald-50/20 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#004b30] bg-emerald-100 px-3 py-1 rounded-md">
                    CUMULATIVE AUDIT DECK ({summaryDuration} MONTHS)
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-2">Total Collected Financials</h4>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="bg-emerald-100 text-[#006c4d] px-3.5 py-1.5 rounded-xl border border-emerald-200">
                    👨‍🎓 Active Students: {totalStudents}
                  </span>
                  <span className="bg-slate-200/80 text-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-300">
                    👨‍🏫 Staff Roster: {totalStaffCount} Active
                  </span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 uppercase tracking-wider">Total Revenue Collected</span>
                    <span className="text-[#004b30] text-sm">PKR {cumulativeRevenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-4 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-[#004b30] rounded-full transition-all duration-500" 
                      style={{ width: `${cumulativeRevPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 uppercase tracking-wider">Total Operating Expenses</span>
                    <span className="text-rose-600 text-sm">PKR {cumulativeExpenses.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-4 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                      style={{ width: `${cumulativeExpPercent}%` }}
                    ></div>
                  </div>
                </div>

              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-700 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-slate-500 font-bold">Net Cumulative Earnings:</span>
                  <span className={`font-extrabold text-base ${cumulativeProfit >= 0 ? 'text-[#004b30]' : 'text-rose-600'}`}>
                    PKR {cumulativeProfit.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="uppercase text-slate-500 font-bold">Total Uncollected Dues:</span>
                  <span className="font-extrabold text-base text-rose-600">
                    PKR {cumulativePendingDues.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </>
      )}
    </div>
  );
}