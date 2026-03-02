import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawConnectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!rawConnectionString) {
  throw new Error('Missing DATABASE_URL (or DIRECT_URL) for Prisma client');
}

const connectionUrl = new URL(rawConnectionString);
if (!connectionUrl.searchParams.has('uselibpqcompat')) {
  // Required for Supabase TLS compatibility when using node-postgres via Prisma adapter.
  connectionUrl.searchParams.set('uselibpqcompat', 'true');
}

const connectionString = connectionUrl.toString();

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
