'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7); // "2026-10"
}

export default function ExpensesClient({ instituteId, instituteName }) {
  const router = useRouter();
  const supabase = createClient();

  const [month, setMonth] = useState(currentMonthStr());
  const [expenses, setExpenses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [feesList, setFeesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New expense form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rent & Utilities');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadFinancialData() {
    if (!instituteId) return;
    setLoading(true);

    try {
      const [expRes, staffRes, feeRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('institute_id', instituteId).order('expense_date', { ascending: false }),
        supabase.from('staff').select('*').eq('institute_id', instituteId),
        supabase.from('fees').select('*').eq('academy_id', instituteId).eq('fee_month', month),
      ]);

      setExpenses(expRes.data || []);
      setStaffList(staffRes.data || []);
      setFeesList(feeRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinancialData();
  }, [month, instituteId]);

  // Calculations
  const totalRevenue = feesList
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const totalStaffSalaries = staffList
    .reduce((sum, s) => sum + Number(s.salary || 0), 0);

  const filteredExpenses = expenses.filter(e => e.expense_date?.startsWith(month));

  const totalCustomExpenses = filteredExpenses
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalOutflows = totalStaffSalaries + totalCustomExpenses;
  const netProfit = totalRevenue - totalOutflows;

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!title || !amount) return;

    setSubmitting(true);
    setError('');

    const { error: insErr } = await supabase.from('expenses').insert({
      institute_id: instituteId,
      title,
      category,
      amount: Number(amount),
      expense_date: new Date().toISOString().slice(0, 10),
    });

    setSubmitting(false);

    if (insErr) {
      setError(insErr.message);
      return;
    }

    setTitle('');
    setAmount('');
    loadFinancialData();
    router.refresh();
  }

  async function handleDeleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    loadFinancialData();
  }

  // Print Monthly Profit & Loss Report
  function handlePrintReport() {
    // 1. Build staff rows cleanly outside the template string
    const staffRowsHtml = staffList.length === 0 
      ? '<tr><td colspan="3">No staff recorded</td></tr>' 
      : staffList.map(s => `<tr><td>${s.full_name}</td><td>${s.role ? s.role : 'Teacher'}</td><td>PKR ${Number(s.salary ? s.salary : 0).toLocaleString()}</td></tr>`).join('');

    // 2. Build expense rows cleanly outside the template string
    const expenseRowsHtml = filteredExpenses.length === 0 
      ? '<tr><td colspan="4">No custom expenses recorded</td></tr>' 
      : filteredExpenses.map(e => `<tr><td>${e.title}</td><td>${e.category}</td><td>${e.expense_date}</td><td>PKR ${Number(e.amount).toLocaleString()}</td></tr>`).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial P&L Report - ${instituteName} (${month})</title>
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
            .profit-box { text-align: center; background: ${netProfit >= 0 ? '#d1fae5' : '#fee2e2'}; color: ${netProfit >= 0 ? '#065f46' : '#b91c1c'}; border: 1px solid ${netProfit >= 0 ? '#10b981' : '#ef4444'}; padding: 15px; border-radius: 12px; margin-top: 25px; }
            .profit-box h2 { margin: 5px 0 0; font-size: 28px; }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div>
                <h1>${instituteName}</h1>
                <p>Monthly Profit & Loss Statement</p>
              </div>
              <div class="badge">Period: ${month}</div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <p>Total Revenue Collected</p>
                <h3 style="color: #006c4d;">PKR ${totalRevenue.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Total Outflows (Salaries + Expenses)</p>
                <h3 style="color: #dc2626;">PKR ${totalOutflows.toLocaleString()}</h3>
              </div>
            </div>

            <h3 style="font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px;">Staff Salaries Payout</h3>
            <table>
              <thead>
                <tr><th>Staff Member</th><th>Role</th><th>Monthly Salary</th></tr>
              </thead>
              <tbody>
                ${staffRowsHtml}
              </tbody>
            </table>

            <h3 style="font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px;">Custom Expenses & Utilities</h3>
            <table>
              <thead>
                <tr><th>Title</th><th>Category</th><th>Date</th><th>Amount</th></tr>
              </thead>
              <tbody>
                ${expenseRowsHtml}
              </tbody>
            </table>

            <div class="profit-box">
              <p style="margin:0; font-size:11px; font-weight:bold; text-transform:uppercase;">Net Profit / Earnings</p>
              <h2>PKR ${netProfit.toLocaleString()}</h2>
            </div>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Expenses & Net Profit</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track overhead costs, staff salaries, and net earnings &middot; <span className="text-[#006c4d] font-semibold">{instituteName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print P&L Report
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

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Financial Summary Bento Grid (Square grid on mobile: grid-cols-2, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Collected Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-[#006c4d] mt-1">PKR {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Staff Salaries Payout</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">PKR {totalStaffSalaries.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Other Expenses</p>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">PKR {totalCustomExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border-l-4 border-l-[#006c4d]">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Net Profit ({month})</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-[#006c4d]' : 'text-rose-600'}`}>
            PKR {netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Add Expense Form & Ledger Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm h-fit space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Add Custom Expense</h3>
          <p className="text-xs text-slate-500">Record rent, electricity bills, tea, markers, or repair costs.</p>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Electricity Bill"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006c4d]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006c4d]/20"
              >
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="Supplies & Stationery">Supplies & Stationery</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Miscellaneous">Miscellaneous / Tea</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (PKR)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006c4d]/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Expense'}
            </button>
          </form>
        </div>

        {/* Expense List Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Recorded Expenses ({month})</h3>

          {loading ? (
            <p className="text-xs text-slate-400 py-10 text-center">Loading expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No custom expenses recorded for this month.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto pr-1">
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between py-3.5 gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{exp.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {exp.category} &middot; Date: {exp.expense_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-rose-600">- PKR {Number(exp.amount).toLocaleString()}</span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Expense"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}