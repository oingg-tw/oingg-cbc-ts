import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { z } from 'zod';
import { getCompanyBusinessItems } from './service';

const paramsSchema = z.object({
  businessAccountingNo: z.string().regex(/^\d{8}$/, '統一編號須為 8 碼數字'),
});

export const getCompanyBusinessItemsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = paramsSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid businessAccountingNo.',
        errors: validationResult.error.format(),
      });
    }

    const { businessAccountingNo } = validationResult.data;
    const result = await getCompanyBusinessItems(businessAccountingNo);

    if (!result.success) {
      return res.status(502).json({
        message: 'Failed to fetch company business items from GCIS.',
        error: result.error,
      });
    }

    if (result.records.length === 0) {
      return res.status(404).json({
        message: `No company found for businessAccountingNo=${businessAccountingNo}.`,
      });
    }

    res.status(200).json(result.records);
  } catch (error) {
    console.error('Company business items query failed:', error);
    next(error);
  }
};
