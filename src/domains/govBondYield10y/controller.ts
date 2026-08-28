import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { z } from 'zod';
import { ingestMonthlyGovBondYield10y } from './service';

const requestSchema = z.object({
  force: z.boolean().optional().default(false), // true 時已存在的月份也強制覆寫
});

export const ingestGovBondYield10y = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = requestSchema.safeParse(req.body ?? {});
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body.',
        errors: validationResult.error.format(),
      });
    }

    const result = await ingestMonthlyGovBondYield10y(validationResult.data.force);

    if (!result.success) {
      return res.status(502).json({
        message: 'Failed to fetch 10-year gov bond secondary market yield data from CBC.',
        error: result.error,
      });
    }

    res.status(200).json({
      message: `Ingested 10-year gov bond secondary market yield data: ${result.fetched} fetched, ${result.skipped} skipped (of ${result.totalPoints} months total).`,
      ...result,
    });
  } catch (error) {
    console.error('Gov bond yield ingestion failed:', error);
    next(error);
  }
};
