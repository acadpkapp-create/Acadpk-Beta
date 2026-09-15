'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7); // "2026-08"
}

export default function FeesClient({ academyId, academyName }) {
  const [month, setMonth] = useState(currentMonthStr());
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState({}); // student_id -> fee row
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const supabase = createClient();

  async function loadData() {
    setLoading(true);
    setError('');

    const [{ data: studentData, error: studentError }, { data: feeData, error: feeError }] =
      await Promise.all([
        supabase.from('students').select('*').order('name', { ascending: true }),
        supabase.from('fees').select('*').eq('fee_month', month),
      ]);

    setLoading(false);

    if (studentError) {
      setError(studentError.message);
      return;
    }
    if (feeError) {
      setError(feeError.message);
      return;
    }

    setStudents(studentData);
    const map = {};
    feeData.forEach((f) => {
      map[f.student_id] = f;
    });
    setFees(map);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const studentsMissingFees = students.filter((s) => !fees[s.id]);

  async function generateThisMonth() {
    if (studentsMissingFees.length === 0) return;
    setGenerating(true);
    setError('');

    const rows = studentsMissingFees.map((s) => ({
      academy_id: academyId,
      student_id: s.id,
      fee_month: month,
      amount: s.monthly_fee || 0,
      status: 'due',
    }));

    const { error } = await supabase.from('fees').insert(rows);
    setGenerating(false);

    if (error) {
      setError(error.message);
      return;
    }
    loadData();
  }

  async function togglePaid(feeRow) {
    const newStatus = feeRow.status === 'paid' ? 'due' : 'paid';
    setFees((prev) => ({ ...prev, [feeRow.student_id]: { ...feeRow, status: newStatus } })); // optimistic

    const { error } = await supabase
      .from('fees')
      .update({ status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null })
      .eq('id', feeRow.id);

    if (error) {
      setError(error.message);
      loadData();
    }
  }

  const paidCount = Object.values(fees).filter((f) => f.status === 'paid').length;
  const totalDue = Object.values(fees)
    .filter((f) => f.status === 'due')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Fees</h1>
          <p className="text-sm text-gray-500">{academyName}</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}

      {!loading && students.length > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          {paidCount} / {students.length} paid this month
          {totalDue > 0 && <span className="text-rose-500"> · PKR {totalDue} still due</span>}
        </p>
      )}

      {!loading && studentsMissingFees.length > 0 && students.length > 0 && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mt-4 flex items-center justify-between animate-fade-up">
          <p className="text-sm text-gray-700">
            {studentsMissingFees.length} student{studentsMissingFees.length > 1 ? 's' : ''} not yet
            billed for {month}
          </p>
          <button
            onClick={generateThisMonth}
            disabled={generating}
            className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all"
          >
            {generating ? 'Generating…' : 'Generate this month\u2019s fees'}
          </button>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-gray-400">
            No students yet. <a href="/students" className="text-brand-500">Add some first</a>.
          </p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
            {students.map((s, i) => {
              const fee = fees[s.id];
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-4 animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {fee ? `PKR ${fee.amount}` : 'Not billed yet this month'}
                    </p>
                  </div>
                  {fee ? (
                    <button
                      onClick={() => togglePaid(fee)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                        fee.status === 'paid'
                          ? 'bg-teal-500 text-white'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {fee.status === 'paid' ? 'Paid' : 'Due — mark paid'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">&mdash;</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
