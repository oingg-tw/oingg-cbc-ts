import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config, stripQuotes } from '../../shared/config';

// Prisma 7 removed schema-level `url`/`directUrl` — the runtime client now needs a driver adapter
// passed in explicitly. Pooled connection (DATABASE_URL, 帶 -pooler) here; `prisma migrate` uses
// the direct (non-pooled) DIRECT_URL instead, configured separately in prisma.config.ts.
const adapter = new PrismaPg({ connectionString: stripQuotes(process.env.DATABASE_URL) });

// Instantiate a single PrismaClient instance to be used across the application.
export const prisma = new PrismaClient({
  adapter,
  // 'query' 開下去在批次 ingest（例如一次幾百筆 company-profile）時會洗版，開發環境只留 warn/error。
  log: config.isProduction ? ['error'] : ['warn', 'error'],
});

export const connectDb = async () => {
  try {
    await prisma.$connect();
    console.log('[db]: Connected to database.');
  } catch (error) {
    console.error('[db]: Could not connect to the database.', error);
    throw error; // Re-throw to be caught by the server starter and prevent server from starting.
  }
};

export default prisma;
