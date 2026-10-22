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
  const [allFees, setAllFees] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!instituteId) return;
      setLoading(true);

      const [stRes, clRes, sfRes, feRes, exRes, allFeRes, allExRes] = await Promise.all([
        supabase.from('students').select('*').eq('institute_id', instituteId),
        supabase.from('classes').select('*').eq('institute_id', instituteId),
        supabase.from('staff').select('*').eq('institute_id', instituteId),
        supabase.from('fees').select('*').eq('academy_id', instituteId).eq('fee_month', month),
        supabase.from('expenses').select('*').eq('institute_id', instituteId),
        supabase.from('fees').select('*').eq('academy_id', instituteId),
        supabase.from('expenses').select('*').eq('institute_id', instituteId),
      ]);

      setStudents(stRes.data || []);
      setClasses(clRes.data || []);
      setStaff(sfRes.data || []);
      setFees(feRes.data || []);
      setExpenses(exRes.data || []);
      setAllFees(allFeRes.data || []);
      setAllExpenses(allExRes.data || []);
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

  // Staff Salaries Total
  const totalStaffSalaries = staff.reduce((sum, s) => sum + Number(s.salary || 0), 0);

  // Custom Overhead Expenses for selected month
  const monthCustomExpenses = expenses
    .filter(e => e.expense_date?.startsWith(month) || e.created_at?.startsWith(month))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // FIXED: Total Expenses includes Salaries + Overhead
  const totalExpensesMonth = totalStaffSalaries + monthCustomExpenses;
  const netProfitMonth = totalCollectedMonth - totalExpensesMonth;

  // Class distribution count
  const classBreakdown = classes.map(c => {
    const count = students.filter(s => s.class_name?.toLowerCase() === c.name?.toLowerCase()).length;
    return { name: c.name, count, shift: c.shift || 'General' };
  });

  // Generate 4-Month Comparison Data
  function getPastMonthsList() {
    const months = [];
    const curr = new Date(month + '-01');
    for (let i = 3; i >= 0; i--) {
      const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  }

  const pastMonths = getPastMonthsList();
  const comparisonData = pastMonths.map(m => {
    const rev = allFees
      .filter(f => f.fee_month === m && f.status === 'paid')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    const custExp = allExpenses
      .filter(e => e.expense_date?.startsWith(m) || e.created_at?.startsWith(m))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const exp = totalStaffSalaries + custExp;
    const profit = rev - exp;

    return { monthStr: m, revenue: rev, expenses: exp, profit };
  });

  const maxComparisonVal = Math.max(
    ...comparisonData.map(d => Math.max(d.revenue, d.expenses, Math.abs(d.profit))),
    1
  );

  // Print Analytics Report
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
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">TOTAL STUDENTS</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{totalStudents}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-1">Active roster count</p>
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
                    <span className="text-[#004b30]">PKR {totalCollectedMonth.toLocaleString()}</span>
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
                  Your institute currently maintains an active headcount of <strong>{totalStudents} students</strong> spread across <strong>{activeBatches} active batches</strong>.
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

          {/* NEW: MULTI-MONTH VERTICAL BAR COMPARISON GRAPH */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Multi-Month Growth & Performance Comparison</h3>
                <p className="text-xs text-slate-500">Track revenue vs expenses vs net profit trends across previous months</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#004b30]"></span> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500"></span> Expenses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Profit</span>
              </div>
            </div>

            {/* Vertical Bar Chart Graphic */}
            <div className="grid grid-cols-4 gap-4 items-end h-60 pt-6 pb-2 border-b border-slate-100">
              {comparisonData.map((d, idx) => {
                const revHeight = (d.revenue / maxComparisonVal) * 100;
                const expHeight = (d.expenses / maxComparisonVal) * 100;
                const profitHeight = (Math.max(0, d.profit) / maxComparisonVal) * 100;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1.5 sm:gap-2 w-full justify-center h-full">
                      {/* Revenue Bar */}
                      <div 
                        title={`Revenue: PKR ${d.revenue.toLocaleString()}`}
                        className="w-3 sm:w-6 bg-[#004b30] rounded-t-md transition-all duration-300 group-hover:opacity-90"
                        style={{ height: `${Math.max(revHeight, 4)}%` }}
                      ></div>
                      {/* Expenses Bar */}
                      <div 
                        title={`Expenses: PKR ${d.expenses.toLocaleString()}`}
                        className="w-3 sm:w-6 bg-rose-500 rounded-t-md transition-all duration-300 group-hover:opacity-90"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                      ></div>
                      {/* Net Profit Bar */}
                      <div 
                        title={`Profit: PKR ${d.profit.toLocaleString()}`}
                        className="w-3 sm:w-6 bg-emerald-500 rounded-t-md transition-all duration-300 group-hover:opacity-90"
                        style={{ height: `${Math.max(profitHeight, 4)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-2">{d.monthStr}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Breakdown Sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Batch Enrollment Distribution */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Batch Enrollment Breakdown</h3>
              <p className="text-xs text-slate-500">Student headcount distribution across your active classes.</p>

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
        </>
      )}
    </div>
  );
}
