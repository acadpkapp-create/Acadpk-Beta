import { createClient } from '@supabase/supabase-js';

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  leave: 'bg-yellow-100 text-yellow-700',
};

export default async function ParentPage({ params }) {
  const { token } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.rpc('get_parent_view', { p_token: token });

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-gray-500">
          This link isn&apos;t valid. Please ask the academy for a new one.
        </p>
      </main>
    );
  }

  const { student, attendance, fees } = data;

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <p className="text-sm text-brand-500 font-semibold">{student.academy_name}</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{student.name}</h1>
      <p className="text-sm text-gray-500 mb-6">{student.class_or_subject || 'No class set'}</p>

      <h2 className="font-semibold text-gray-900 mb-2">Fees</h2>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100 mb-6">
        {fees.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No fee records yet.</p>
        ) : (
          fees.map((f) => (
            <div key={f.fee_month} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-700">{f.fee_month}</span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  f.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {f.status === 'paid' ? 'Paid' : `Due — PKR ${f.amount}`}
              </span>
            </div>
          ))
        )}
      </div>

      <h2 className="font-semibold text-gray-900 mb-2">Recent attendance</h2>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {attendance.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No attendance marked yet.</p>
        ) : (
          attendance.map((a) => (
            <div key={a.attendance_date} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-700">{a.attendance_date}</span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[a.status]}`}
              >
                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
