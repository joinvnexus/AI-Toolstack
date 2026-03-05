import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, createServerClientMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createServerClientMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}));

import { PUT } from '@/app/api/user/profile/route';

const createJsonRequest = (body: unknown) =>
  new Request('http://localhost/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const setupSupabase = (args: {
  user: unknown;
  authError?: unknown;
  updateUserResult?: { data: unknown; error: unknown };
}) => {
  const updateUserMock = vi.fn().mockResolvedValue(
    args.updateUserResult ?? {
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          user_metadata: {
            name: 'Updated User',
            avatar_url: 'https://example.com/avatar.png',
          },
        },
      },
      error: null,
    }
  );

  createServerClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: args.user },
        error: args.authError ?? null,
      }),
      updateUser: updateUserMock,
    },
  });

  return { updateUserMock };
};

describe('PUT /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      getAll: vi.fn().mockReturnValue([]),
    });
  });

  it('returns 401 for unauthenticated user', async () => {
    setupSupabase({ user: null, authError: new Error('No auth') });

    const response = await PUT(createJsonRequest({ name: 'Test' }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Not authenticated' });
  });

  it('returns 400 for invalid payload', async () => {
    const { updateUserMock } = setupSupabase({
      user: { id: 'user-1', email: 'user@example.com' },
    });

    const response = await PUT(createJsonRequest({ avatarUrl: 'not-a-url' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Avatar URL must be valid' });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('updates profile and returns normalized user payload', async () => {
    setupSupabase({
      user: { id: 'user-1', email: 'user@example.com' },
      updateUserResult: {
        data: {
          user: {
            id: 'user-1',
            email: 'user@example.com',
            user_metadata: {
              name: 'Updated User',
              avatar_url: 'https://example.com/avatar.png',
            },
          },
        },
        error: null,
      },
    });

    const response = await PUT(
      createJsonRequest({
        name: 'Updated User',
        avatarUrl: 'https://example.com/avatar.png',
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Updated User',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });
});
