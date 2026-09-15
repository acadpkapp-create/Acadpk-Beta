import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AttendanceClient from './attendance-client';

export default async function AttendancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: staffRow } = await supabase
    .from('staff')
    .select('academy_id, academies(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!staffRow) {
    redirect('/onboarding');
  }

  return (
    <AttendanceClient academyId={staffRow.academy_id} academyName={staffRow.academies?.name} />
  );
}
