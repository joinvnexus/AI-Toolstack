import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RequireAdminResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

const resolveRole = (role: unknown): 'USER' | 'ADMIN' =>
  typeof role === 'string' && role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';

export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  const role = resolveRole(user.app_metadata?.role ?? user.user_metadata?.role);
  if (role !== 'ADMIN') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authorized' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
