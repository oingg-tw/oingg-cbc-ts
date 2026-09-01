import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// CLI-only config (generate / migrate / studio). Runtime PrismaClient in
// src/adapters/prisma/index.ts sets up its own @prisma/adapter-pg adapter with DATABASE_URL —
// migrate needs the direct (non-pooled) connection instead, see NEON.md for why. Replaces the old
// prisma.config.js (broken, pre-Prisma-7 shape) and the deprecated package.json "prisma" block.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
