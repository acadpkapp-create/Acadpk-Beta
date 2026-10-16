import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

async function handleAccountDeletion() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Find every academy this user is staff of.
    const { data: staffRows, error: staffError } = await admin
      .from('staff')
      .select('id, academy_id')
      .eq('user_id', user.id);

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    for (const row of staffRows || []) {
      const { count } = await admin
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', row.academy_id);

      if ((count ?? 0) <= 1) {
        // Only staff member — delete the whole academy and cascaded tables.
        await admin.from('academies').delete().eq('id', row.academy_id);
      } else {
        // Other staff share this academy — only remove this user's access.
        await admin.from('staff').delete().eq('id', row.id);
      }
    }

    // Also clean up any 'institutes' records associated with this user if they exist
    await admin.from('institutes').delete().eq('user_id', user.id);

    // Finally, delete the actual login/auth account.
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Critical error during account deletion:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// Support both POST and DELETE to prevent method mismatch errors
export async function POST() {
  return handleAccountDeletion();
}

export async function DELETE() {
  return handleAccountDeletion();
}