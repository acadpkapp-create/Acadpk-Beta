import { createClient } from '@/lib/supabase-client';
import StaffClient from './staff-client';

export default async function StaffPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let academyId = null;
  let academyName = 'AcadPK Portal';
  let initialStaff = [];

  if (user) {
    const { data: inst } = await supabase
      .from('institutes')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (inst) {
      academyId = inst.id;
      academyName = inst.name;
    }
  }

  // Fetch ALL staff records for development convenience so you can see them instantly
  const { data: staffData, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff:', error.message);
  }

  if (staffData) {
    initialStaff = staffData;
  }

  return (
    <StaffClient
      academyId={academyId}
      academyName={academyName}
      initialStaff={initialStaff}
    />
  );
}