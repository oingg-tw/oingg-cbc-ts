import { Router } from 'ultimate-express';
import { ingestCompanyIndustryClassificationController } from '@/domains/companyIndustryClassification/controller';

const router = Router();

/**
 * @swagger
 * /api/ingest/company-industry-classification:
 *   post:
 *     summary: 為已登記的公司回填官方行業分類代碼
 *     description: >
 *       對 company_profiles 裡目前追蹤的每一家公司，下載財政部財政資訊中心《全國營業(稅籍)登記資料集》
 *       （data.gov.tw/dataset/9400，約 322MB、171 萬列全國登記營業人，無查詢式 API，只能整份下載
 *       再過濾——用串流逐行處理，不會整份載進記憶體），找出該統編「總公司本身」的登記列（統一編號=
 *       自己、總機構統一編號=空白），取其主要行業代號，轉換成 tax_industry_classification 的
 *       subclass 代碼格式後 upsert 進 company_industry_classifications。
 *
 *       這是官方稅籍登記指派的行業別，不是拿 GCIS 營業項目（company_business_items）反推——後者一家
 *       公司常十幾筆、且代碼系統跟 tax_industry_classification 不同，雜訊很大（已用亞洲水泥實測驗證
 *       過兩者對不起來）。
 *     tags:
 *       - Ingestion
 *     security:
 *       - TaskSecret: []
 *     responses:
 *       200:
 *         description: 回填完成，回傳追蹤家數、成功比對數、稅籍檔裡找不到的家數、行業代號對不到分類表的家數。
 *       502:
 *         description: 下載或處理財政部稅籍登記資料失敗。
 */
router.post('/company-industry-classification', ingestCompanyIndustryClassificationController);

export default router;
