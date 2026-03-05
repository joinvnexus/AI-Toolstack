import { describe, expect, it } from 'vitest';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

describe('resolveRoleFromAppMetadata', () => {
  it('returns ADMIN for uppercase and lowercase admin role values', () => {
    expect(resolveRoleFromAppMetadata({ role: 'ADMIN' })).toBe('ADMIN');
    expect(resolveRoleFromAppMetadata({ role: 'admin' })).toBe('ADMIN');
  });

  it('returns USER when role is missing or invalid', () => {
    expect(resolveRoleFromAppMetadata({})).toBe('USER');
    expect(resolveRoleFromAppMetadata({ role: 'EDITOR' })).toBe('USER');
    expect(resolveRoleFromAppMetadata(null)).toBe('USER');
  });
});
