'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

export function useAdminCheck() {
  const router = useRouter();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push('/login');
          return;
        }

        // Get user role from metadata or profile
        const role = resolveRoleFromAppMetadata(authUser.app_metadata);
        
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: role,
        });

        if (role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [supabase, router]);

  return { isAdmin, isLoading, user };
}
