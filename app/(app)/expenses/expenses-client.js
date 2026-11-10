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
  const [loading, setLoading] = useState(true);

  // New expense form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rent & Utilities');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit Expense State
  const [editingExpense, setEditingExpense] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');

  async function loadFinancialData() {
    if (!instituteId) return;
    setLoading(true);

    try {
      const [expRes, staffRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('institute_id', instituteId).order('expense_date', { ascending: false }),
        supabase.from('staff').select('*').eq('institute_id', instituteId),
      ]);

      setExpenses(expRes.data || []);
      setStaffList(staffRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinancialData();
  }, [instituteId]);

  // Calculations for selected month
  const totalStaffSalaries = staffList.reduce((sum, s) => sum + Number(s.salary || 0), 0);

  const filteredExpenses = expenses.filter(e => e.expense_date?.startsWith(month));
  const totalCustomExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalExpensesRecorded = totalStaffSalaries + totalCustomExpenses;

  // Category breakdowns
  const rentUtilitiesTotal = filteredExpenses
    .filter(e => e.category === 'Rent & Utilities')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const suppliesTotal = filteredExpenses
    .filter(e => e.category === 'Supplies & Stationery')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const maintenanceTotal = filteredExpenses
    .filter(e => e.category === 'Maintenance' || e.category === 'Maintenance & Repairs')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const miscTotal = filteredExpenses
    .filter(e => e.category === 'Miscellaneous' || e.category === 'Miscellaneous / Tea')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const maintenanceMiscTotal = maintenanceTotal + miscTotal;

  // Bar Graph categories dataset
  const categoriesBreakdown = [
    { name: 'Staff Salaries', amount: totalStaffSalaries, color: 'bg-[#004b30]' },
    { name: 'Rent & Utilities', amount: rentUtilitiesTotal, color: 'bg-sky-500' },
    { name: 'Supplies & Stationery', amount: suppliesTotal, color: 'bg-amber-500' },
    { name: 'Maintenance & Misc', amount: maintenanceMiscTotal, color: 'bg-rose-500' },
  ];

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
    if (!confirm('Are you sure you want to delete this expense entry?')) return;

    const { error: delErr } = await supabase.from('expenses').delete().eq('id', id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    loadFinancialData();
    router.refresh();
  }

  function startEditing(exp) {
    setEditingExpense(exp);
    setEditTitle(exp.title);
    setEditCategory(exp.category);
    setEditAmount(exp.amount);
  }

  async function handleUpdateExpense(e) {
    e.preventDefault();
    if (!editingExpense) return;

    const { error: upErr } = await supabase
      .from('expenses')
      .update({
        title: editTitle,
        category: editCategory,
        amount: Number(editAmount),
      })
      .eq('id', editingExpense.id);

    if (upErr) {
      setError(upErr.message);
      return;
    }

    setEditingExpense(null);
    loadFinancialData();
    router.refresh();
  }

  // Export Expense Report Function
  function handleExportReport() {
    const staffRowsHtml = staffList.length === 0
      ? '<tr><td colspan="2">No staff recorded</td></tr>'
      : staffList.map(st => `<tr><td>${st.full_name} (${st.role || 'Teacher'})</td><td>PKR ${Number(st.salary || 0).toLocaleString()}</td></tr>`).join('');

    const customRowsHtml = filteredExpenses.length === 0
      ? '<tr><td colspan="3">No custom expenses recorded for this month</td></tr>'
      : filteredExpenses.map(ex => `<tr><td>${ex.title}</td><td>${ex.category}</td><td>PKR ${Number(ex.amount || 0).toLocaleString()}</td></tr>`).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expense & Cost Report - ${instituteName} (${month})</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; background: #fff; }
            .report { border: 2px solid #004b30; border-radius: 16px; padding: 35px; max-width: 750px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { color: #004b30; margin: 0; font-size: 22px; }
            .badge { background: #fee2e2; color: #dc2626; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
            .card { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .card p { margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .card h3 { margin: 5px 0 0; font-size: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f1f5f9; color: #475569; }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div>
                <h1>${instituteName}</h1>
                <p>Expense & Cost Management Report</p>
              </div>
              <div class="badge">Period: ${month}</div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <p>Total Expenses Outflow</p>
                <h3 style="color: #dc2626;">PKR ${totalExpensesRecorded.toLocaleString()}</h3>
              </div>
              <div class="card">
                <p>Staff Payroll</p>
                <h3>PKR ${totalStaffSalaries.toLocaleString()}</h3>
              </div>
            </div>

            <h3 style="font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px;">Staff Salaries Roster</h3>
            <table>
              <thead><tr><th>Staff Member & Role</th><th>Monthly Salary</th></tr></thead>
              <tbody>${staffRowsHtml}</tbody>
            </table>

            <h3 style="font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px;">Recorded Overhead Expenses</h3>
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Amount</th></tr></thead>
              <tbody>${customRowsHtml}</tbody>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Expenses & Cost Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Record overhead costs, view total expense meters, and analyze spending patterns &middot; <span className="text-[#004b30] font-semibold">{instituteName}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportReport}
            className="px-4 py-2.5 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Expense Report
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

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* METERS: 5-COLUMN GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL EXPENSES</p>
          <div className="mt-2">
            <h3 className="text-lg sm:text-xl font-black text-rose-600">PKR {totalExpensesRecorded.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">For {month}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STAFF SALARIES</p>
          <div className="mt-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">PKR {totalStaffSalaries.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Fixed payroll</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UTILITIES & RENT</p>
          <div className="mt-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">PKR {rentUtilitiesTotal.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Overhead bills</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUPPLIES & STATIONERY</p>
          <div className="mt-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">PKR {suppliesTotal.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Classroom supplies</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MAINTENANCE & MISC</p>
          <div className="mt-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">PKR {maintenanceMiscTotal.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Repairs & tea</p>
          </div>
        </div>
      </div>

      {/* MAIN GRID: ADD EXPENSE FORM & BAR GRAPH ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4 h-fit">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Add New Expense</h3>
            <p className="text-xs text-slate-400">Record rent, bills, or supplies</p>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Electricity Bill"
                className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#004b30] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#004b30] text-slate-900"
              >
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="Supplies & Stationery">Supplies & Stationery</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Miscellaneous">Miscellaneous / Tea</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#004b30] text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Expense Entry'}
            </button>
          </form>
        </div>

        {/* Expense Breakdown Bar Graph Analysis */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Expense Breakdown Analysis</h3>
            <p className="text-xs text-slate-400">Comparative visual bar breakdown of institute expenditures</p>
          </div>

          <div className="space-y-4 my-2">
            {categoriesBreakdown.map((cat, idx) => {
              const percentage = totalExpensesRecorded > 0 ? Math.round((cat.amount / totalExpensesRecorded) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{cat.name}</span>
                    <span className="text-slate-900">PKR {cat.amount.toLocaleString()} <span className="text-slate-400 font-normal">({percentage}%)</span></span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, cat.amount > 0 ? 3 : 0)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-2">
            <span>Tip: Staff salaries account for the majority of fixed expenses.</span>
            <span className="font-bold text-slate-900">Total Outflow: PKR {totalExpensesRecorded.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* RECORDED EXPENSES TABLE WITH EDIT & DELETE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Recorded Expenses ({month})</h3>
          <p className="text-xs text-slate-400">Manage, edit, or remove expense entries for this period</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Title</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                    No custom expenses recorded for {month}.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{exp.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{exp.expense_date || exp.created_at?.slice(0, 10)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-600">PKR {Number(exp.amount || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => startEditing(exp)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Expense Entry</h3>
                <p className="text-xs text-slate-400">Update expense details</p>
              </div>
              <button 
                onClick={() => setEditingExpense(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#004b30] text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#004b30] text-slate-900"
                >
                  <option value="Rent & Utilities">Rent & Utilities</option>
                  <option value="Supplies & Stationery">Supplies & Stationery</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Miscellaneous">Miscellaneous / Tea</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#004b30] text-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}