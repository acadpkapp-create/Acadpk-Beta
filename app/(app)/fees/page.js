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

  // Fetch the user's institute for proper multi-tenant isolation
  const { data: institute } = await supabase
    .from('institutes')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <FeesClient 
      instituteId={institute?.id || null} 
      instituteName={institute?.name || 'AcadPK Portal'} 
    />
  );
}