import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Prefer .env.local in dev while still supporting .env defaults.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const datasourceUrl = process.env.DIRECT_URL || env('DATABASE_URL');
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl,
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
