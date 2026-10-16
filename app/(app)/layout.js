import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AppShell from './app-shell';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default async function AppLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch tenant info from 'institutes' table
  const { data: instituteRow } = await supabase
    .from('institutes')
    .select('name, type')
    .eq('user_id', user.id)
    .maybeSingle();

  let overdueFeesCount = 0;
  let onLeaveCount = 0;

  try {
    const [feesResult, studentsResult] = await Promise.all([
      supabase
        .from('fees')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'due')
        .lt('fee_month', currentMonth()),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'on_leave'),
    ]);

    overdueFeesCount = feesResult.count || 0;
    onLeaveCount = studentsResult.count || 0;
  } catch (err) {
    console.warn('Operational metrics could not be fetched:', err.message);
  }

  const academyName = instituteRow?.name || 'AcadPK Portal';
  const instituteType = instituteRow?.type || 'School / College';
  const displayName = academyName !== 'AcadPK Portal' ? academyName : (user.email?.split('@')[0] || 'Administrator');

  return (
    <AppShell
      academyName={academyName}
      instituteType={instituteType}
      userName={displayName}
      userEmail={user.email}
      alerts={{ overdueFeesCount, onLeaveCount }}
    >
      {children}
    </AppShell>
  );
}