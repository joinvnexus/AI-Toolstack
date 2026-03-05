'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
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

type UserReview = {
  id: string;
  rating: number;
  content: string;
  helpfulCount: number;
  createdAt: string;
  tool: {
    id: string;
    name: string;
    slug: string;
    category: {
      name: string;
    };
  };
};

type DashboardTab = 'bookmarks' | 'reviews' | 'settings';

const VALID_TABS: DashboardTab[] = ['bookmarks', 'reviews', 'settings'];

const getTabFromQuery = (tab: string | null): DashboardTab =>
  VALID_TABS.includes(tab as DashboardTab) ? (tab as DashboardTab) : 'bookmarks';

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkWithTool[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('bookmarks');
  const [settingsName, setSettingsName] = useState('');
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push('/login');
          return;
        }

        const initialName = authUser.user_metadata?.name || '';
        const initialAvatarUrl = authUser.user_metadata?.avatar_url || '';

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: initialName || null,
          avatarUrl: initialAvatarUrl || null,
        });
        setSettingsName(initialName);
        setSettingsAvatarUrl(initialAvatarUrl);

        const [bookmarksRes, reviewsRes] = await Promise.all([
          fetch('/api/user/bookmarks'),
          fetch('/api/user/reviews'),
        ]);

        if (bookmarksRes.ok) {
          const bookmarksData = await bookmarksRes.json();
          setBookmarks(bookmarksData);
        }

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  useEffect(() => {
    setActiveTab(getTabFromQuery(searchParams.get('tab')));
  }, [searchParams]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleTabChange = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    router.push(`/dashboard?tab=${tabId}`);
  };

  const handleSettingsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = settingsName.trim();

    if (!trimmedName) {
      setSettingsError('Name cannot be empty');
      setSettingsSuccess('');
      return;
    }

    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const payload: { name: string; avatarUrl?: string } = { name: trimmedName };
      const trimmedAvatarUrl = settingsAvatarUrl.trim();
      if (trimmedAvatarUrl) {
        payload.avatarUrl = trimmedAvatarUrl;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setSettingsError(data.error || 'Failed to update profile');
        return;
      }

      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              name: data.name || null,
              avatarUrl: data.avatarUrl || null,
            }
          : currentUser
      );
      setSettingsName(data.name || '');
      setSettingsAvatarUrl(data.avatarUrl || '');
      setSettingsSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setSettingsError('Failed to update profile');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) return null;

  const tabs: { id: DashboardTab; label: string; icon: typeof Bookmark }[] = [
    { id: 'bookmarks', label: `Bookmarks (${bookmarks.length})`, icon: Bookmark },
    { id: 'reviews', label: `My Reviews (${reviews.length})`, icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      <div className="ui-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary">
            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user.name || 'User'}</h1>
            <p className="text-sm text-brand-muted">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border ui-border px-4 py-2 text-sm text-brand-muted hover:bg-brand-primary/10 hover:text-brand-text sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      <div className="border-b ui-border">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-text'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bookmarks' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Saved Tools</h2>
          {bookmarks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <Link
                  key={bookmark.id}
                  href={`/tools/${bookmark.tool.slug}`}
                  className="ui-card p-5 transition hover:border-brand-primary/60"
                >
                  <h3 className="font-medium">{bookmark.tool.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-brand-muted">{bookmark.tool.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-brand-muted">{bookmark.tool.category.name}</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {bookmark.tool.rating.toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ui-card p-8 text-center">
              <Bookmark className="mx-auto h-8 w-8 text-brand-muted" />
              <p className="mt-4 text-brand-muted">No bookmarks yet. Start saving your favorite tools!</p>
              <Link href="/tools" className="mt-4 inline-block text-brand-primary hover:underline">
                Browse tools
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Your Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="ui-card p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/tools/${review.tool.slug}`} className="font-medium hover:text-brand-primary">
                      {review.tool.name}
                    </Link>
                    <span className="text-sm text-brand-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-brand-muted">{review.tool.category.name}</p>

                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-brand-muted/40'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-sm text-brand-muted">{review.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="ui-card p-8 text-center">
              <Star className="mx-auto h-8 w-8 text-brand-muted" />
              <p className="mt-4 text-brand-muted">You have not written any reviews yet.</p>
              <Link href="/tools" className="mt-4 inline-block text-brand-primary hover:underline">
                Find tools to review
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="ui-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Account Settings</h2>
          <form onSubmit={handleSettingsSubmit} className="max-w-md space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={settingsName}
                onChange={(event) => {
                  setSettingsName(event.target.value);
                  setSettingsError('');
                  setSettingsSuccess('');
                }}
                className="ui-input w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Avatar URL</label>
              <input
                type="url"
                value={settingsAvatarUrl}
                onChange={(event) => {
                  setSettingsAvatarUrl(event.target.value);
                  setSettingsError('');
                  setSettingsSuccess('');
                }}
                placeholder="https://example.com/avatar.png"
                className="ui-input w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                defaultValue={user.email}
                disabled
                className="ui-input w-full cursor-not-allowed opacity-60"
              />
            </div>
            {settingsError && <p className="text-sm text-red-400">{settingsError}</p>}
            {settingsSuccess && <p className="text-sm text-emerald-400">{settingsSuccess}</p>}
            <button
              type="submit"
              disabled={settingsSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {settingsSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function DashboardPageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageFallback />}>
      <DashboardPageContent />
    </Suspense>
  );
}
