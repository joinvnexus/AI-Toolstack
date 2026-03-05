import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireAdminMock, categoryCreateMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  categoryCreateMock: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    category: {
      create: categoryCreateMock,
      findMany: vi.fn(),
    },
  },
}));

import { POST } from '@/app/api/categories/route';

const createJsonRequest = (body: unknown) =>
  new Request('http://localhost/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns guard response when requester is not admin', async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Not authorized' }, { status: 403 }),
    });

    const response = await POST(createJsonRequest({ name: 'AI' }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Not authorized' });
    expect(categoryCreateMock).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid payload', async () => {
    requireAdminMock.mockResolvedValue({
      ok: true,
      user: { id: 'admin-1', email: 'admin@example.com', name: 'Admin', avatarUrl: null },
    });

    const response = await POST(createJsonRequest({ name: '   ' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Name is required' });
    expect(categoryCreateMock).not.toHaveBeenCalled();
  });

  it('creates category and returns 201 for valid admin request', async () => {
    requireAdminMock.mockResolvedValue({
      ok: true,
      user: { id: 'admin-1', email: 'admin@example.com', name: 'Admin', avatarUrl: null },
    });
    categoryCreateMock.mockResolvedValue({
      id: 'cat-1',
      name: 'AI Tools',
      slug: 'ai-tools',
      description: 'desc',
      icon: 'icon',
    });

    const response = await POST(
      createJsonRequest({ name: 'AI Tools', description: 'desc', icon: 'icon' })
    );

    expect(categoryCreateMock).toHaveBeenCalledWith({
      data: {
        name: 'AI Tools',
        slug: 'ai-tools',
        description: 'desc',
        icon: 'icon',
      },
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: 'cat-1',
      slug: 'ai-tools',
    });
  });
});
