'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Wrench, FileText, Star, Settings } from 'lucide-react';

type Stats = {
  totalTools: number;
  totalUsers: number;
  totalReviews: number;
  totalPosts: number;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalTools: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // For demo purposes, allow access. In production, check user role
        // const { data: profile } = await supabase
        //   .from('profiles')
        //   .select('role')
        //   .eq('id', user.id)
        //   .single();
        
        // if (profile?.role !== 'ADMIN') {
        //   router.push('/dashboard');
        //   return;
        // }

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
        <div className="mt-4 text-center py-8">
          <p className="text-brand-muted">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}
