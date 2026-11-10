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

  // Fetch full institute profile safely
  const { data: instituteRow } = await supabase
    .from('institutes')
    .select('id, name, type, phone, email, address, tagline, logo_url, stamp_url')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <SettingsClient
      userEmail={user.email}
      role="Admin"
      academyId={instituteRow?.id || null}
      academyName={instituteRow?.name || 'AcadPK Portal'}
      instituteType={instituteRow?.type || 'School / College'}
      initialPhone={instituteRow?.phone || ''}
      initialEmail={instituteRow?.email || user.email || ''}
      initialAddress={instituteRow?.address || ''}
      initialTagline={instituteRow?.tagline || ''}
      initialLogoUrl={instituteRow?.logo_url || ''}
      initialStampUrl={instituteRow?.stamp_url || ''}
    />
  );
}