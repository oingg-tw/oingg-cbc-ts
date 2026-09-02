import { type Request, type Response, type NextFunction } from 'ultimate-express';
import { ingestCompanyIndustryClassification } from '@/domains/companyIndustryClassification/service';

export const ingestCompanyIndustryClassificationController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ingestCompanyIndustryClassification();

    if (!result.success) {
      return res.status(502).json({
        message: 'Failed to ingest company industry classification from FIA registry.',
        error: result.error,
      });
    }

    res.status(200).json({
      message: `共追蹤 ${result.targetCount} 家公司：${result.matched} 家成功比對到官方行業分類（共 ${result.totalClassificationRows} 筆分類，含主要+次要行業代號），${result.notFoundInRegistry} 家在稅籍登記檔裡找不到總公司列，${result.invalidIndustryCode} 家行業代號對不到分類表。`,
      ...result,
    });
  } catch (error) {
    console.error('Company industry classification ingestion failed:', error);
    next(error);
  }
};
