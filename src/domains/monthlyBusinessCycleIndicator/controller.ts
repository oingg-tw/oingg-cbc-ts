import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { ingestMonthlyBusinessCycleIndicator } from '@/domains/monthlyBusinessCycleIndicator/service';
import { forceIngestBodySchema } from '@/shared/openapiSchemas';

export const ingestMonthlyBusinessCycleIndicatorController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = forceIngestBodySchema.safeParse(req.body ?? {});
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
