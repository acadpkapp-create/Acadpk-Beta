import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AppShell from './app-shell';

export default async function AppLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: staffRow } = await supabase
    .from('staff')
    .select('academies(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <AppShell academyName={staffRow?.academies?.name} userEmail={user.email}>
      {children}
    </AppShell>
  );
}
