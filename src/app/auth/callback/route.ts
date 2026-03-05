import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const response = NextResponse.redirect(`${origin}/dashboard`);

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.headers.get('cookie')?.split('; ').map(c => {
              const [key, ...v] = c.split('=');
              return { name: key, value: v.join('=') };
            }) || [];
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let targetPath = '/dashboard';
      if (next) {
        targetPath = next;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const isAdmin = resolveRoleFromAppMetadata(user?.app_metadata) === 'ADMIN';
        targetPath = isAdmin ? '/admin' : '/dashboard';
      }

      response.headers.set('Location', `${origin}${targetPath}`);
      return response;
    }
  }

  // Return the user to an error page with instructions
  response.headers.set('Location', `${origin}/login?error=auth_error`);
  return response;
}
