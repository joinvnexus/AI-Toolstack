import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

type RequireAdminResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string | null;
        name: string | null;
        avatarUrl: string | null;
      };
    }
  | { ok: false; response: NextResponse };

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

  const role = resolveRoleFromAppMetadata(user.app_metadata);
  if (role !== 'ADMIN') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authorized' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email || null,
      name: user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    },
  };
}
