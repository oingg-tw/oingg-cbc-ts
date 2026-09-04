import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { ingestMonthlyCpi } from '@/domains/monthlyCpi/service';
import { forceIngestBodySchema } from '@/shared/openapiSchemas';

export const ingestMonthlyCpiController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = forceIngestBodySchema.safeParse(req.body ?? {});
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body.',
        errors: validationResult.error.format(),
      });
    }

    const result = await ingestMonthlyCpi(validationResult.data.force);

    if (!result.success) {
      return res.status(502).json({
        message: 'Failed to fetch CPI data from DGBAS.',
        error: result.error,
      });
    }

    res.status(200).json({
      message: `Ingested monthly CPI data: ${result.fetched} fetched, ${result.skipped} skipped (of ${result.totalPoints} points total).`,
      ...result,
    });
  } catch (error) {
    console.error('Monthly CPI ingestion failed:', error);
    next(error);
  }
};
