import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import ExpensesClient from './expenses-client';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: institute } = await supabase
    .from('institutes')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <ExpensesClient 
      instituteId={institute?.id || null} 
      instituteName={institute?.name || 'AcadPK Portal'} 
    />
  );
}