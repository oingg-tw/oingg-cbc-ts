import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { z } from 'zod';
import { listTaxIndustryClassification, getTaxIndustryClassificationByCode } from './service';

const listQuerySchema = z.object({
  level: z.enum(['section', 'division', 'group', 'class', 'subclass']).optional(),
  sectionCode: z.string().optional(),
  divisionCode: z.string().optional(),
  groupCode: z.string().optional(),
  classCode: z.string().optional(),
});

export const listTaxIndustryClassificationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = listQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid query parameters.',
        errors: validationResult.error.format(),
      });
    }

    const records = await listTaxIndustryClassification(validationResult.data);
    res.status(200).json(records);
  } catch (error) {
    console.error('Tax industry classification list query failed:', error);
    next(error);
  }
};

const codeParamSchema = z.object({
  code: z.string().min(1),
});

export const getTaxIndustryClassificationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = codeParamSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid code.',
        errors: validationResult.error.format(),
      });
    }

    const record = await getTaxIndustryClassificationByCode(validationResult.data.code);
    if (!record) {
      return res.status(404).json({
        message: `No tax industry classification found for code=${validationResult.data.code}.`,
      });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error('Tax industry classification lookup failed:', error);
    next(error);
  }
};
