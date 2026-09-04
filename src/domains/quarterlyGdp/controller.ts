import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { ingestQuarterlyGdp } from '@/domains/quarterlyGdp/service';
import { forceIngestBodySchema } from '@/shared/openapiSchemas';

export const ingestQuarterlyGdpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = forceIngestBodySchema.safeParse(req.body ?? {});
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body.',
        errors: validationResult.error.format(),
      });
    }

    const result = await ingestQuarterlyGdp(validationResult.data.force);

    if (!result.success) {
      return res.status(502).json({
        message: 'Failed to fetch GDP data from DGBAS.',
        error: result.error,
      });
    }

    res.status(200).json({
      message: `Ingested quarterly GDP data: ${result.fetched} fetched, ${result.skipped} skipped (of ${result.totalPoints} points total).`,
      ...result,
    });
  } catch (error) {
    console.error('Quarterly GDP ingestion failed:', error);
    next(error);
  }
};
