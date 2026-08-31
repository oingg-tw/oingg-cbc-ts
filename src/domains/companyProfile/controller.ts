import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { z } from 'zod';
import { registerCompanyProfile, getCompanyProfileByTaxId, getCompanyProfileByStockCode } from './service';

const registerBodySchema = z.object({
  stockCode: z.string().regex(/^[0-9A-Z]{4,6}$/, '證券代碼須為 4-6 碼英數字'),
  taxId: z.string().regex(/^\d{8}$/, '統一編號須為 8 碼數字'),
  force: z.boolean().optional().default(false), // true 時即使已有資料也重新向 GCIS 抓取並覆寫
});

export const registerCompanyProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = registerBodySchema.safeParse(req.body ?? {});
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body.',
        errors: validationResult.error.format(),
      });
    }

    const { stockCode, taxId, force } = validationResult.data;
    const result = await registerCompanyProfile(stockCode, taxId, force);

    if (!result.success) {
      if (result.notFound) {
        return res.status(404).json({ message: result.error });
      }
      return res.status(502).json({
        message: 'Failed to register company profile.',
        error: result.error,
      });
    }

    res.status(200).json({
      message: result.skipped
        ? `taxId=${taxId} 已有資料，已跳過（帶 force=true 可強制重新抓取）。`
        : `taxId=${taxId} 登記完成。`,
      skipped: result.skipped ?? false,
      profile: result.profile,
    });
  } catch (error) {
    console.error('Company profile registration failed:', error);
    next(error);
  }
};

const taxIdParamSchema = z.object({ taxId: z.string().regex(/^\d{8}$/, '統一編號須為 8 碼數字') });

export const getCompanyProfileByTaxIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = taxIdParamSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid taxId.', errors: validationResult.error.format() });
    }

    const profile = await getCompanyProfileByTaxId(validationResult.data.taxId);
    if (!profile) {
      return res.status(404).json({ message: `No company profile found for taxId=${validationResult.data.taxId}.` });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Company profile lookup by taxId failed:', error);
    next(error);
  }
};

const stockCodeParamSchema = z.object({ stockCode: z.string().regex(/^[0-9A-Z]{4,6}$/, '證券代碼須為 4-6 碼英數字') });

export const getCompanyProfileByStockCodeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = stockCodeParamSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid stockCode.', errors: validationResult.error.format() });
    }

    const profile = await getCompanyProfileByStockCode(validationResult.data.stockCode);
    if (!profile) {
      return res.status(404).json({ message: `No company profile found for stockCode=${validationResult.data.stockCode}.` });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Company profile lookup by stockCode failed:', error);
    next(error);
  }
};
