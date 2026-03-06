'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, Search, LogOut, Settings, Bookmark, LayoutDashboard, Wrench, FileText, Users, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { resolveRoleFromAppMetadata, type AppRole } from '@/lib/auth/role';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/blog', label: 'Blog' },
];

const resolveUserRole = (authUser: SupabaseUser | null): AppRole => {
  if (!authUser) return 'USER';
  return resolveRoleFromAppMetadata(authUser.app_metadata);
};

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const role = resolveUserRole(user);
  const isAdmin = role === 'ADMIN';

  const userLinks = user
    ? [
        { href: '/dashboard', label: 'User Dashboard', icon: LayoutDashboard },
        { href: '/dashboard?tab=bookmarks', label: 'Bookmarks', icon: Bookmark },
        { href: '/dashboard?tab=settings', label: 'Settings', icon: Settings },
      ]
    : [];

  const adminLinks = user
    ? [
        { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Manage Users', icon: Users },
        { href: '/admin/tools', label: 'Manage Tools', icon: Wrench },
        { href: '/admin/reviews', label: 'Manage Reviews', icon: Star },
        { href: '/admin/posts', label: 'Manage Posts', icon: FileText },
        { href: '/admin/settings', label: 'Admin Settings', icon: Settings },
      ]
    : [];

  const dropdownLinks = isAdmin ? adminLinks : userLinks;

  return (
    <header className="sticky top-0 z-50 border-b ui-border bg-brand-background/80 backdrop-blur-xl">
      <nav className="container-shell flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-brand-primary">AI</span> Toolstack
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-brand-muted hover:text-brand-text">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="ui-ring rounded-lg p-2 text-brand-muted hover:text-brand-text"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <ThemeToggle />

          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-brand-muted/20" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="ui-ring flex items-center gap-2 rounded-lg p-1.5 text-brand-muted hover:text-brand-text"
                aria-label="User menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-medium text-white">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="ui-card absolute right-0 mt-2 w-56 py-1"
                  >
                    <div className="border-b ui-border px-4 py-2">
                      <p className="truncate text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-brand-muted">{isAdmin ? 'ADMIN' : 'USER'}</p>
                    </div>
                    {dropdownLinks.map((link) => (
                      <Link
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-brand-muted hover:bg-brand-primary/10 hover:text-brand-text"
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleSignOut}
                      className="mt-1 flex w-full items-center gap-2 border-t ui-border px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-brand-muted hover:text-brand-text">
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ui-ring rounded-lg p-2 text-brand-muted hover:text-brand-text md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b ui-border bg-brand-surface/90"
          >
            <div className="container-shell py-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools, categories..."
                  className="ui-input ui-input-icon-lg w-full py-3 pr-4"
                  autoFocus
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b ui-border bg-brand-surface/95 md:hidden"
          >
            <div className="container-shell space-y-2 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-2 text-brand-muted hover:bg-brand-primary/10 hover:text-brand-text"
                >
                  {link.label}
                </Link>
              ))}

              {user ? null : (
                <div className="space-y-2 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg border ui-border px-4 py-2 text-center text-brand-muted hover:bg-brand-primary/10 hover:text-brand-text"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg bg-brand-primary px-4 py-2 text-center font-medium text-white hover:bg-brand-primary/90"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(userMenuOpen || mobileMenuOpen || searchOpen) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setUserMenuOpen(false);
            setMobileMenuOpen(false);
            setSearchOpen(false);
          }}
        />
      )}
    </header>
  );
}

