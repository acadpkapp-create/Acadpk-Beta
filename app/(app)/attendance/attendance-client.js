'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_STYLES = {
  present: 'bg-teal-500 text-white',
  absent: 'bg-rose-500 text-white',
  leave: 'bg-amber-500 text-white',
};

export default function AttendanceClient({ academyId, academyName }) {
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({}); // student_id -> status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function loadData() {
    setLoading(true);
    setError('');

    const [{ data: studentData, error: studentError }, { data: attendanceData, error: attError }] =
      await Promise.all([
        supabase.from('students').select('*').order('name', { ascending: true }),
        supabase.from('attendance').select('*').eq('attendance_date', date),
      ]);

    setLoading(false);

    if (studentError) {
      setError(studentError.message);
      return;
    }
    if (attError) {
      setError(attError.message);
      return;
    }

    setStudents(studentData);
    const map = {};
    attendanceData.forEach((r) => {
      map[r.student_id] = r.status;
    });
    setRecords(map);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function markStatus(studentId, status) {
    setRecords((prev) => ({ ...prev, [studentId]: status })); // optimistic

    const { error } = await supabase
      .from('attendance')
      .upsert(
        { academy_id: academyId, student_id: studentId, attendance_date: date, status },
        { onConflict: 'student_id,attendance_date' }
      );

    if (error) {
      setError(error.message);
      loadData(); // revert to real state on failure
    }
  }

  const presentCount = Object.values(records).filter((s) => s === 'present').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">{academyName}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}

      {!loading && students.length > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          {presentCount} / {students.length} marked present
        </p>
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
            {students.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-5 py-4 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.class_or_subject || 'No class set'}</p>
                </div>
                <div className="flex gap-2">
                  {['present', 'absent', 'leave'].map((status) => (
                    <button
                      key={status}
                      onClick={() => markStatus(s.id, status)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        records[s.id] === status
                          ? `${STATUS_STYLES[status]} border-transparent`
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
