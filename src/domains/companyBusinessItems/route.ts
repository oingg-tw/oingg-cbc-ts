import { Router } from 'ultimate-express';
import { getCompanyBusinessItemsController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/query/company-business-items/{businessAccountingNo}:
 *   get:
 *     summary: 查詢公司登記的所有營業項目
 *     description: >
 *       透過經濟部商工行政資料開放平台 API（資料集 236EE382-4942-41A9-BD03-CA0709025E7C）以統一編號
 *       查詢，原樣回傳該公司登記的完整資料（公司名稱、狀態、設立日期，以及 Cmp_Business 陣列——每列
 *       是一個編碼過的營業項目，或所營事業自由文字說明）。這是即時查詢，不寫入資料庫，也不做任何轉換。
 *     tags:
 *       - Query
 *     parameters:
 *       - in: path
 *         name: businessAccountingNo
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{8}$'
 *         description: 統一編號（8 碼數字）
 *         example: '22099131'
 *     responses:
 *       200:
 *         description: 該公司登記的完整資料（GCIS 原始回應）。
 *       400:
 *         description: 統一編號格式錯誤。
 *       404:
 *         description: 查無此統一編號的公司登記資料。
 *       502:
 *         description: 向 GCIS 查詢失敗。
 */
router.get('/company-business-items/:businessAccountingNo', getCompanyBusinessItemsController);

export default router;
