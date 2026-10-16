import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch institute info directly from the 'institutes' table to ensure consistency across views
  const { data: instituteRow } = await supabase
    .from('institutes')
    .select('id, name, type')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <SettingsClient
      userEmail={user.email}
      role="Admin"
      academyId={instituteRow?.id || null}
      academyName={instituteRow?.name || 'AcadPK Portal'}
      instituteType={instituteRow?.type || 'School / College'}
    />
  );
}