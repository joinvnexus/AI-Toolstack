'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAdminCheck } from '@/lib/hooks/use-admin-check';
import { Loader2, AlertCircle, Save, User, Shield } from 'lucide-react';

const userSearchSchema = z.object({
  email: z.string().email('Valid email required'),
});

const roleUpdateSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['USER', 'ADMIN']),
});

type UserSearchFormData = z.infer<typeof userSearchSchema>;
type RoleUpdateFormData = z.infer<typeof roleUpdateSchema>;

type UserInfo = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export default function AdminSettingsPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const searchForm = useForm<UserSearchFormData>({
    resolver: zodResolver(userSearchSchema),
  });

  const roleForm = useForm<RoleUpdateFormData>({
    resolver: zodResolver(roleUpdateSchema),
    defaultValues: {
      role: 'USER',
    },
  });

  const handleSearch = async (data: UserSearchFormData) => {
    setSearching(true);
    setMessage(null);
    setUserInfo(null);

    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(data.email)}`);
      
      if (res.ok) {
        const userData = await res.json();
        if (userData && userData.email) {
          setUserInfo(userData);
          roleForm.setValue('email', userData.email);
          roleForm.setValue('role', userData.role || 'USER');
        } else {
          setMessage({ type: 'error', text: 'User not found' });
        }
      } else {
        setMessage({ type: 'error', text: 'Error searching user' });
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage({ type: 'error', text: 'Error searching user' });
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateRole = async (data: RoleUpdateFormData) => {
    setUpdating(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, role: data.role }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUserInfo(updatedUser);
        setMessage({ type: 'success', text: `User role updated to ${data.role}!` });
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'Error updating role' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'Error updating role' });
    } finally {
      setUpdating(false);
    }
  };

  if (adminLoading) {
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
        <p className="mt-2 text-brand-muted">You don't have permission to access this page.</p>
        <Link href="/dashboard" className="mt-4 text-brand-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-brand-muted">Manage user roles and site settings</p>
      </div>

      {/* User Role Management */}
      <div className="ui-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-primary" />
          <h2 className="text-lg font-semibold">Manage User Roles</h2>
        </div>

        {/* Search User Form */}
        <form onSubmit={searchForm.handleSubmit(handleSearch)} className="mb-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Search by Email</label>
            <div className="flex gap-2">
              <input
                {...searchForm.register('email')}
                type="email"
                placeholder="user@example.com"
                className="flex-1 rounded-lg border ui-border bg-brand-background/40 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
              <button
                type="submit"
                disabled={searching}
                className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                Search
              </button>
            </div>
            {searchForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-500">{searchForm.formState.errors.email.message}</p>
            )}
          </div>
        </form>

        {/* Message */}
        {message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* User Info & Role Update */}
        {userInfo && (
          <div className="rounded-lg border ui-border bg-brand-background/40 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{userInfo.email}</p>
                <p className="text-sm text-brand-muted">ID: {userInfo.id}</p>
                <p className="text-sm text-brand-muted">Created: {new Date(userInfo.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                userInfo.role === 'ADMIN' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-primary/15 text-brand-muted'
              }`}>
                {userInfo.role}
              </span>
            </div>

            <form onSubmit={roleForm.handleSubmit(handleUpdateRole)} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">Set Role</label>
                <select
                  {...roleForm.register('role')}
                  className="ui-input w-full"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-600/90 disabled:opacity-50"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Role
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SQL Instructions */}
      <div className="ui-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Alternative: Set Admin via SQL</h2>
        <p className="mb-4 text-sm text-brand-muted">
          You can also run this SQL in Supabase SQL Editor to make a user admin:
        </p>
        <div className="rounded-lg bg-black/50 p-4 text-sm text-white">
          <p className="text-green-400">-- Replace with user's email</p>
          <p>update auth.users</p>
          <p>set raw_app_meta_data = jsonb_set(raw_app_meta_data, &apos;{"{role}"}&apos;, &apos;"ADMIN"&apos;)</p>
          <p>where email = &apos;your-email@example.com&apos;;</p>
        </div>
      </div>
    </div>
  );
}

