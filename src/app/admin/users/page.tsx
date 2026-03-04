'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminCheck } from '@/lib/hooks/use-admin-check';
import { AlertCircle, Loader2, RefreshCcw, Search, Shield, Users } from 'lucide-react';

type AdminUser = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | string;
  created_at: string;
};

type FlashMessage = {
  type: 'success' | 'error';
  text: string;
};

export default function AdminUsersPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [message, setMessage] = useState<FlashMessage | null>(null);

  const fetchUsers = async (asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setMessage(null);

    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch users');
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to fetch users',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchUsers();
    }
  }, [adminLoading, isAdmin]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' ? true : user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleRoleUpdate = async (targetUser: AdminUser, nextRole: 'USER' | 'ADMIN') => {
    if (targetUser.role === nextRole) return;

    setUpdatingId(targetUser.id);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetUser.email, role: nextRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update role');
      }

      setUsers((prev) =>
        prev.map((user) => (user.id === targetUser.id ? { ...user, role: data.role } : user))
      );

      setMessage({
        type: 'success',
        text: `Updated ${targetUser.email} to ${data.role}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update role',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-brand-muted">You don&apos;t have permission to access this page.</p>
        <Link href="/dashboard" className="mt-4 text-brand-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-brand-muted">View users and update roles</p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border ui-border bg-brand-primary/10 px-4 py-2 text-sm font-medium hover:bg-brand-primary/15 disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by email..."
            className="ui-input w-full py-2 pl-10 pr-4"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'USER' | 'ADMIN')}
          className="rounded-lg border ui-border bg-brand-surface px-4 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="ui-card p-4">
          <p className="text-sm text-brand-muted">Total Users</p>
          <p className="mt-2 text-2xl font-semibold">{users.length}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-brand-muted">Admins</p>
          <p className="mt-2 text-2xl font-semibold">{users.filter((u) => u.role === 'ADMIN').length}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-brand-muted">Members</p>
          <p className="mt-2 text-2xl font-semibold">{users.filter((u) => u.role === 'USER').length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border ui-border bg-brand-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b ui-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Joined</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-brand-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b ui-border hover:bg-brand-primary/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-xs text-brand-muted">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-brand-primary/20 text-brand-primary'
                            : 'bg-brand-primary/15 text-brand-muted'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRoleUpdate(user, 'USER')}
                          disabled={updatingId === user.id || user.role === 'USER'}
                          className="rounded-lg border ui-border bg-brand-primary/10 px-3 py-1.5 text-xs font-medium hover:bg-brand-primary/15 disabled:opacity-50"
                        >
                          Set USER
                        </button>
                        <button
                          onClick={() => handleRoleUpdate(user, 'ADMIN')}
                          disabled={updatingId === user.id || user.role === 'ADMIN'}
                          className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
                        >
                          {updatingId === user.id ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Saving
                            </span>
                          ) : (
                            'Set ADMIN'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-brand-muted">
                    No users found for the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

