'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Bookmark, Star, Settings, LogOut } from 'lucide-react';

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

type BookmarkWithTool = {
  id: string;
  createdAt: string;
  tool: {
    id: string;
    name: string;
    slug: string;
    description: string;
    rating: number;
    reviewCount: number;
    category: {
      name: string;
    };
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkWithTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookmarks');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        setUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        });

        // Fetch bookmarks
        const res = await fetch('/api/user/bookmarks');
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary">
            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user.name || 'User'}</h1>
            <p className="text-sm text-brand-muted">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-brand-primary text-white'
                  : 'border-transparent text-brand-muted hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'bookmarks' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Saved Tools</h2>
          {bookmarks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={`/tools/${bookmark.tool.slug}`}
                  className="rounded-2xl border border-white/10 bg-brand-surface p-5 transition hover:border-brand-primary/60"
                >
                  <h3 className="font-medium">{bookmark.tool.name}</h3>
                  <p className="mt-1 text-sm text-brand-muted line-clamp-2">
                    {bookmark.tool.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-brand-muted">{bookmark.tool.category.name}</span>
                    <span>⭐ {bookmark.tool.rating.toFixed(1)}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-brand-surface p-8 text-center">
              <Bookmark className="mx-auto h-8 w-8 text-brand-muted" />
              <p className="mt-4 text-brand-muted">No bookmarks yet. Start saving your favorite tools!</p>
              <a href="/tools" className="mt-4 inline-block text-brand-primary hover:underline">
                Browse tools
              </a>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="rounded-2xl border border-white/10 bg-brand-surface p-8 text-center">
          <Star className="mx-auto h-8 w-8 text-brand-muted" />
          <p className="mt-4 text-brand-muted">You have not written any reviews yet.</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">Account Settings</h2>
          <form className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                defaultValue={user.name || ''}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                defaultValue={user.email}
                disabled
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none opacity-50"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium hover:bg-brand-primary/90"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
