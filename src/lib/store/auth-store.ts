import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
} | null;

interface AuthState {
  user: User;
  loading: boolean;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      set({
        user: profile ? {
          id: user.id,
          email: user.email!,
          name: profile.name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
        } : null,
        loading: false,
      });
    } else {
      set({ user: null, loading: false });
    }
  },
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
