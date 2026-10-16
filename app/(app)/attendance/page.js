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

  // Fetch institute
  let { data: instData } = await supabase
    .from('institutes')
    .select('id, name, type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!instData) {
    const { data: newInst } = await supabase
      .from('institutes')
      .insert([{ user_id: user.id, name: 'AcadPK Portal', type: 'School / College' }])
      .select('id, name, type')
      .single();
    instData = newInst;
  }

  return (
    <AttendanceClient
      instituteId={instData?.id}
      instituteName={instData?.name || 'AcadPK Portal'}
    />
  );
}