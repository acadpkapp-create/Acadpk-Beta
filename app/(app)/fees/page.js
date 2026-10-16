import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import FeesClient from './fees-client';

export default async function FeesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Gracefully fetch staff info without forcing an onboarding redirect trap
  const { data: staffRow } = await supabase
    .from('staff')
    .select('academy_id, academies(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <FeesClient 
      academyId={staffRow?.academy_id || null} 
      academyName={staffRow?.academies?.name || 'AcadPK Portal'} 
    />
  );
}