import { Router } from 'ultimate-express';
import { getCompanyProfileByTaxIdController, getCompanyProfileByStockCodeController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/query/company-profile/tax-id/{taxId}:
 *   get:
 *     summary: 依統編查詢已登記的公司主檔
 *     description: 讀取先前透過 POST /api/ingest/company-profile 存下的公司主檔與營業項目，不會即時打 GCIS。
 *     tags:
 *       - Query
 *     parameters:
 *       - in: path
 *         name: taxId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{8}$'
 *         example: '22099131'
 *     responses:
 *       200:
 *         description: 該統編的公司主檔與營業項目。
 *       404:
 *         description: 尚未登記過此統編。
 */
router.get('/company-profile/tax-id/:taxId', getCompanyProfileByTaxIdController);

/**
 * @swagger
 * /api/query/company-profile/stock-code/{stockCode}:
 *   get:
 *     summary: 依證券代碼查詢已登記的公司主檔
 *     description: 讀取先前透過 POST /api/ingest/company-profile 存下的公司主檔與營業項目，不會即時打 GCIS。
 *     tags:
 *       - Query
 *     parameters:
 *       - in: path
 *         name: stockCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9A-Z]{4,6}$'
 *         example: '2330'
 *     responses:
 *       200:
 *         description: 該證券代碼的公司主檔與營業項目。
 *       404:
 *         description: 尚未登記過此證券代碼。
 */
router.get('/company-profile/stock-code/:stockCode', getCompanyProfileByStockCodeController);

export default router;
