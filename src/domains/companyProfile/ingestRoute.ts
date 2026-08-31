import { Router } from 'ultimate-express';
import { registerCompanyProfileController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/ingest/company-profile:
 *   post:
 *     summary: 登記公司主檔（證券代碼＋統編），並向 GCIS 抓取營業項目存檔
 *     description: >
 *       呼叫端自行配對好「證券代碼」與「統一編號」傳入，本服務不驗證兩者是否真的對應同一家公司。
 *       用統編向 GCIS 商工登記資料查詢，把公司基本資料與完整營業項目清單存進 company_profiles /
 *       company_business_items。若該統編已有資料，預設直接跳過、不打 GCIS；帶 force=true 才會
 *       重新抓取並覆寫（含 stockCode、營業項目整批刪除重建）。對 GCIS 的請求本身有節流，同一
 *       process 內每次呼叫至少間隔 1 秒，避免短時間連續打被暫時鎖。
 *     tags:
 *       - Ingestion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stockCode, taxId]
 *             properties:
 *               stockCode:
 *                 type: string
 *                 description: 證券代碼（4-6 碼英數字）
 *                 example: '2330'
 *               taxId:
 *                 type: string
 *                 description: 統一編號（8 碼數字）
 *                 example: '22099131'
 *               force:
 *                 type: boolean
 *                 description: true 時即使該統編已有資料也強制重新向 GCIS 抓取並覆寫，預設 false
 *                 default: false
 *     responses:
 *       200:
 *         description: 登記完成（或因已有資料而跳過），回傳 skipped 旗標與公司主檔/營業項目。
 *       400:
 *         description: 請求格式錯誤。
 *       404:
 *         description: GCIS 查無此統編的公司登記資料。
 *       502:
 *         description: 向 GCIS 查詢失敗，或證券代碼已登記在其他統編下。
 */
router.post('/company-profile', registerCompanyProfileController);

export default router;
