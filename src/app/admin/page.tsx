'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Wrench, FileText, Star, AlertCircle } from 'lucide-react';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

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

type RecentActivityItem = {
  id: string;
  type: 'TOOL' | 'USER' | 'REVIEW' | 'POST';
  title: string;
  description: string;
  createdAt: string;
  href: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
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
        }

        // Fetch stats
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            totalTools: statsData.totalTools || 0,
            totalUsers: statsData.totalUsers || 0,
            totalReviews: statsData.totalReviews || 0,
            totalPosts: statsData.totalPosts || 0,
          });
          setRecentActivity(Array.isArray(statsData.recentActivity) ? statsData.recentActivity : []);
        } else {
          setStats({
            totalTools: 0,
            totalUsers: 0,
            totalReviews: 0,
            totalPosts: 0,
          });
          setRecentActivity([]);
        }
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

  const activityTypeClass: Record<RecentActivityItem['type'], string> = {
    TOOL: 'bg-sky-500/20 text-sky-300',
    USER: 'bg-emerald-500/20 text-emerald-300',
    REVIEW: 'bg-amber-500/20 text-amber-300',
    POST: 'bg-violet-500/20 text-violet-300',
  };

  const formatRelativeTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';

    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60_000) return 'Just now';
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
    if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)}d ago`;

    return date.toLocaleDateString();
  };

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
            className="ui-card p-6 transition hover:border-brand-primary/60"
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
      <div className="ui-card p-6">
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
            className="rounded-xl border ui-border bg-brand-primary/10 px-4 py-3 text-center text-sm font-medium hover:bg-brand-primary/15"
          >
            Write Blog Post
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-xl border ui-border bg-brand-primary/10 px-4 py-3 text-center text-sm font-medium hover:bg-brand-primary/15"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-xl border ui-border bg-brand-primary/10 px-4 py-3 text-center text-sm font-medium hover:bg-brand-primary/15"
          >
            Site Settings
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="ui-card p-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="mt-4 space-y-3">
            {recentActivity.map((activity) => (
              <Link
                key={activity.id}
                href={activity.href}
                className="flex items-center justify-between gap-4 rounded-xl border ui-border bg-brand-primary/10 p-3 transition hover:border-brand-primary/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${activityTypeClass[activity.type]}`}
                    >
                      {activity.type}
                    </span>
                    <p className="truncate text-sm font-medium">{activity.title}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-brand-muted">{activity.description}</p>
                </div>
                <p className="shrink-0 text-xs text-brand-muted">{formatRelativeTime(activity.createdAt)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 py-8 text-center">
            <p className="text-brand-muted">No recent activity to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}

