import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import StudentsClient from './students-client';

export default async function StudentsPage() {
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
    <StudentsClient academyId={staffRow.academy_id} academyName={staffRow.academies?.name} />
  );
}
