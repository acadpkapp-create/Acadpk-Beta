'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import StaffClient from './staff-client';

export default function StaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [academyId, setAcademyId] = useState(null);
  const [academyName, setAcademyName] = useState('AcadPK Portal');
  const [initialStaff, setInitialStaff] = useState([]);

  useEffect(() => {
    async function loadStaffData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: inst } = await supabase
        .from('institutes')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (inst) {
        setAcademyId(inst.id);
        setAcademyName(inst.name);

        const { data: staffData, error } = await supabase
          .from('staff')
          .select('*')
          .eq('institute_id', inst.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching staff:', error.message);
        } else if (staffData) {
          setInitialStaff(staffData);
        }
      }
      setLoading(false);
    }

    loadStaffData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 min-h-screen flex items-center justify-center">
        Loading staff portal...
      </div>
    );
  }

  return (
    <StaffClient
      academyId={academyId}
      academyName={academyName}
      initialStaff={initialStaff}
    />
  );
}