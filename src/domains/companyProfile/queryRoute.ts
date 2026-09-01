import { Router } from 'ultimate-express';
import {
  getCompanyProfileByTaxIdController,
  getCompanyProfileByStockCodeController,
  listCompanyProfileIngestionFailuresController,
  listRegisteredStockCodesController,
} from '@/domains/companyProfile/controller';

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

/**
 * @swagger
 * /api/query/company-profile/stock-codes:
 *   get:
 *     summary: 列出目前已經有營業項目資料的證券代碼（供 TWSE 等外部系統查詢清單）
 *     description: >
 *       回傳目前所有已成功登記（POST /api/ingest/company-profile）的證券代碼清單，每筆只帶
 *       stockCode/taxId/營業項目筆數/最後更新時間，不含完整營業項目內容——只是要知道「這裡有沒有
 *       這支股票的資料」的話用這支即可，需要細節再用 stock-code/{stockCode} 個別查。company_profiles
 *       有資料就代表營業項目一定有（兩者同一個 transaction 一起寫入），不會有「主檔存在但項目是空的」
 *       的情況。按證券代碼排序。
 *     tags:
 *       - Query
 *     responses:
 *       200:
 *         description: 已登記的證券代碼清單。
 */
router.get('/company-profile/stock-codes', listRegisteredStockCodesController);

/**
 * @swagger
 * /api/query/company-profile/failures:
 *   get:
 *     summary: 列出目前尚未成功登記的統編
 *     description: >
 *       讀取 company_profile_ingestion_failures：每個統編一列，代表這個統編從沒成功登記過（不論是
 *       GCIS 抓取失敗、查無此統編、還是 stockCode 衝突），含最後一次的錯誤訊息與累積失敗次數。
 *       一旦該統編成功登記，這裡的紀錄就會被清掉——所以這張表反映的是「現在」還卡住的，不是完整
 *       歷史紀錄。按最後失敗時間新到舊排序。
 *     tags:
 *       - Query
 *     responses:
 *       200:
 *         description: 目前尚未成功登記的統編清單。
 */
router.get('/company-profile/failures', listCompanyProfileIngestionFailuresController);

export default router;
