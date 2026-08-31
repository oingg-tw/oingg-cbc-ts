import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { z } from 'zod';
import { registerCompanyProfile, getCompanyProfileByTaxId, getCompanyProfileByStockCode } from './service';
import type { CompanyProfileWithBusinessItems } from './types';

const registerItemSchema = z.object({
  stockCode: z.string().regex(/^[0-9A-Z]{4,6}$/, '證券代碼須為 4-6 碼英數字'),
  taxId: z.string().regex(/^\d{8}$/, '統一編號須為 8 碼數字'),
});

const registerBodySchema = z.object({
  // 上限 200 筆：GCIS client 有節流（同一 process 內每次呼叫至少間隔 1 秒），一次收太多筆會讓單一
  // HTTP 請求跑很久，容易撞到呼叫端或反向代理的逾時，寧可讓呼叫端自己分批送。
  items: z.array(registerItemSchema).min(1, '至少要有一筆').max(200, '一次最多 200 筆，請分批送'),
  force: z.boolean().optional().default(false), // true 時整批都即使已有資料也重新向 GCIS 抓取並覆寫
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

    const { items, force } = validationResult.data;

    // 外部一次把整個陣列送進來，但進到 gov 之後還是一筆一筆序列處理（不是 Promise.all 平行打）——
    // 一來 GCIS client 本身有節流會把平行請求擠成序列，平行送只會讓每個請求各自排隊等節流，沒有
    // 加速效果；二來序列處理讓單一統編查詢失敗時不會影響其他筆，也方便逐筆記錄成功/跳過/失敗。
    const results: Array<{
      stockCode: string;
      taxId: string;
      success: boolean;
      skipped: boolean;
      error?: string;
      profile?: CompanyProfileWithBusinessItems;
    }> = [];

    for (const { stockCode, taxId } of items) {
      const result = await registerCompanyProfile(stockCode, taxId, force);
      results.push({
        stockCode,
        taxId,
        success: result.success,
        skipped: result.skipped ?? false,
        error: result.error,
        profile: result.profile,
      });
    }

    const succeeded = results.filter((r) => r.success && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.success).length;

    res.status(200).json({
      message: `共 ${results.length} 筆：${succeeded} 筆登記/更新、${skipped} 筆跳過、${failed} 筆失敗。`,
      total: results.length,
      succeeded,
      skipped,
      failed,
      results,
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
