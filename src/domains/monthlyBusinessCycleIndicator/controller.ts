import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { z } from 'zod';
import { ingestMonthlyBusinessCycleIndicator } from '@/domains/monthlyBusinessCycleIndicator/service';

const requestSchema = z.object({
  force: z.boolean().optional().default(false), // true 時已存在的 (year, month) 也強制覆寫
});

export const ingestMonthlyBusinessCycleIndicatorController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = requestSchema.safeParse(req.body ?? {});
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body.',
        errors: validationResult.error.format(),
      });
    }

    const result = await ingestMonthlyBusinessCycleIndicator(validationResult.data.force);

    if (!result.success) {
      return res.status(502).json({
        message: 'Failed to fetch business cycle indicator data from NDC.',
        error: result.error,
      });
    }

    res.status(200).json({
      message: `Ingested monthly business cycle indicator data: ${result.fetched} fetched, ${result.skipped} skipped (of ${result.totalPoints} points total).`,
      ...result,
    });
  } catch (error) {
    console.error('Monthly business cycle indicator ingestion failed:', error);
    next(error);
  }
};
