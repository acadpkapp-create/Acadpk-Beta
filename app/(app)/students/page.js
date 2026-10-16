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

  // Fetch or resolve the institute for the logged-in user
  let { data: instData } = await supabase
    .from('institutes')
    .select('id, name, type')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fallback auto-creation if not initialized yet
  if (!instData) {
    const { data: newInst } = await supabase
      .from('institutes')
      .insert([{ user_id: user.id, name: 'AcadPK Portal', type: 'School / College' }])
      .select('id, name, type')
      .single();
    instData = newInst;
  }

  return (
    <StudentsClient 
      instituteId={instData?.id} 
      instituteName={instData?.name || 'AcadPK Portal'} 
    />
  );
}