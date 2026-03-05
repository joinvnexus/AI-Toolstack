import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

const updateUserRoleSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['USER', 'ADMIN']),
});

const getAdminSupabase = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const adminSupabase = await getAdminSupabase();

    const { data: users, error } = await adminSupabase.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If email provided, search for that specific user
    if (email) {
      const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        role: resolveRoleFromAppMetadata(user.app_metadata),
        created_at: user.created_at,
      });
    }

    // If no email, list all users
    return NextResponse.json(
      users.users.map(u => ({
        id: u.id,
        email: u.email,
        role: resolveRoleFromAppMetadata(u.app_metadata),
        created_at: u.created_at,
      }))
    );
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const parsedBody = updateUserRoleSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }
    const { email, role } = parsedBody.data;

    const adminSupabase = await getAdminSupabase();

    // First find the user
    const { data: users, error: listError } = await adminSupabase.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { data, error } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      { 
        app_metadata: { 
          role: role 
        } 
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      role: resolveRoleFromAppMetadata(data.user.app_metadata),
      created_at: data.user.created_at,
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
