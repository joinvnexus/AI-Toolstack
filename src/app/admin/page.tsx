'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Wrench, FileText, Star, Settings, AlertCircle } from 'lucide-react';

type Stats = {
  totalTools: number;
  totalUsers: number;
  totalReviews: number;
  totalPosts: number;
};

type UserProfile = {
  id: string;
  email: string;
  role: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalTools: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // First check if user is authenticated
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push('/login');
          return;
        }

        // Get user profile with role
        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUser(profile);
          
          // Check if user has admin role
          if (profile.role !== 'ADMIN') {
            // Not admin - redirect to dashboard
            router.push('/dashboard');
            return;
          }
        } else {
          // If profile fetch fails, check user metadata
          const role = authUser.user_metadata?.role || 'USER';
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: role,
          });
          
          if (role !== 'ADMIN') {
            router.push('/dashboard');
            return;
          }
        }

        // Fetch stats
        // In a real app, you'd have an API endpoint for this
        setStats({
          totalTools: 0,
          totalUsers: 0,
          totalReviews: 0,
          totalPosts: 0,
        });
      } catch (error) {
        console.error('Error checking admin:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  // If not admin (should have been redirected, but just in case)
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-brand-muted">You don't have permission to access this page.</p>
        <Link href="/dashboard" className="mt-4 text-brand-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const statsCards = [
    { label: 'Total Tools', value: stats.totalTools, icon: Wrench, href: '/admin/tools' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, href: '/admin/users' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: Star, href: '/admin/reviews' },
    { label: 'Blog Posts', value: stats.totalPosts, icon: FileText, href: '/admin/posts' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-brand-muted">Manage your AI Toolstack platform</p>
        </div>
      </div>

      {/* Admin Info */}
      <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4">
        <p className="text-sm">
          <span className="font-medium">Logged in as:</span> {user.email}
          <span className="ml-2 rounded-full bg-brand-primary/20 px-2 py-0.5 text-xs">ADMIN</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-white/10 bg-brand-surface p-6 transition hover:border-brand-primary/60"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-brand-muted" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/tools/new"
            className="rounded-xl bg-brand-primary px-4 py-3 text-center text-sm font-medium hover:bg-brand-primary/90"
          >
            Add New Tool
          </Link>
          <Link
            href="/admin/posts/new"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium hover:bg-white/10"
          >
            Write Blog Post
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium hover:bg-white/10"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium hover:bg-white/10"
          >
            Site Settings
          </Link>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-4 py-8 text-center">
          <p className="text-brand-muted">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}
