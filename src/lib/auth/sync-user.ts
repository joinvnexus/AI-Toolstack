import prisma from '@/lib/prisma';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

type SyncableAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string; avatar_url?: string };
  app_metadata?: Record<string, unknown>;
};

export const syncUserFromAuth = async (user: SyncableAuthUser) => {
  const email = user.email || `${user.id}@local.invalid`;
  const name = user.user_metadata?.name || null;
  const avatarUrl = user.user_metadata?.avatar_url || null;
  const role = resolveRoleFromAppMetadata(user.app_metadata);

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email,
      name,
      avatarUrl,
      role,
    },
    update: {
      email,
      name,
      avatarUrl,
      role,
    },
  });
};
