import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { z } from 'zod';
import { ingestMonthlyUnemploymentRate } from '@/domains/monthlyUnemploymentRate/service';

const requestSchema = z.object({
  force: z.boolean().optional().default(false), // true 時已存在的 (year, month, category) 也強制覆寫
});

export const ingestMonthlyUnemploymentRateController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = requestSchema.safeParse(req.body ?? {});
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body.',
        errors: validationResult.error.format(),
      });
    }

    const result = await ingestMonthlyUnemploymentRate(validationResult.data.force);

    if (!result.success) {
      return res.status(502).json({
        message: 'Failed to fetch unemployment rate data from DGBAS.',
        error: result.error,
      });
    }

    res.status(200).json({
      message: `Ingested monthly unemployment rate data: ${result.fetched} fetched, ${result.skipped} skipped (of ${result.totalPoints} points total).`,
      ...result,
    });
  } catch (error) {
    console.error('Monthly unemployment rate ingestion failed:', error);
    next(error);
  }
};
