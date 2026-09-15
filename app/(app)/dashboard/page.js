import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

const CARDS = [
  {
    href: '/students',
    label: 'Students',
    desc: 'Add, edit, and manage your student list',
    bg: 'bg-brand-50',
    text: 'text-brand-600',
  },
  {
    href: '/attendance',
    label: 'Attendance',
    desc: 'Mark today\u2019s attendance',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
  },
  {
    href: '/fees',
    label: 'Fees',
    desc: 'Track who\u2019s paid this month',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: staffRow } = await supabase
    .from('staff')
    .select('academy_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!staffRow) {
    redirect('/onboarding');
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1 animate-fade-up">
        Welcome back
      </h1>
      <p className="text-sm text-gray-500 mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        Role: {staffRow.role}
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {CARDS.map((card, i) => (
          <a
            key={card.href}
            href={card.href}
            className={`block rounded-2xl p-6 animate-fade-up ${card.bg} hover:-translate-y-0.5 transition-transform`}
            style={{ animationDelay: `${120 + i * 80}ms` }}
          >
            <p className={`font-display font-semibold ${card.text}`}>{card.label} &rarr;</p>
            <p className="text-sm text-gray-600 mt-1">{card.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
