export type AppRole = 'USER' | 'ADMIN';

const normalizeRole = (value: unknown): AppRole =>
  typeof value === 'string' && value.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';

export const resolveRoleFromAppMetadata = (appMetadata: unknown): AppRole => {
  if (typeof appMetadata !== 'object' || appMetadata === null) return 'USER';

  const role = (appMetadata as { role?: unknown }).role;
  return normalizeRole(role);
};
