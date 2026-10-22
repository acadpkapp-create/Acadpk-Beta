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

    </div>
  );
}