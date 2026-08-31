import { PrismaClient } from '@prisma/client';
import { config } from '../../shared/config';

// Instantiate a single PrismaClient instance to be used across the application.
export const prisma = new PrismaClient({
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
