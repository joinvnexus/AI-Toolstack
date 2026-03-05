import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

import { requireAdmin } from '@/lib/auth/require-admin';

const mockSupabaseUserResult = (user: unknown, error: unknown = null) => {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
    },
  });
};

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseUserResult(null, new Error('Unauthenticated'));

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({ error: 'Not authenticated' });
    }
  });

  it('returns 403 for non-admin user', async () => {
    mockSupabaseUserResult({
      id: 'user-1',
      email: 'user@example.com',
      user_metadata: { name: 'User', avatar_url: null },
      app_metadata: { role: 'USER' },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({ error: 'Not authorized' });
    }
  });

  it('returns admin user context for admin user', async () => {
    mockSupabaseUserResult({
      id: 'admin-1',
      email: 'admin@example.com',
      user_metadata: { name: 'Admin', avatar_url: 'https://example.com/a.png' },
      app_metadata: { role: 'ADMIN' },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin',
        avatarUrl: 'https://example.com/a.png',
      });
    }
  });
});
