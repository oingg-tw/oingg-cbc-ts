import { Router } from 'ultimate-express';
import { registerCompanyProfileController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/ingest/company-profile:
 *   post:
 *     summary: 批次登記公司主檔（證券代碼＋統編陣列），並向 GCIS 抓取營業項目存檔
 *     description: >
 *       外部一次把整批「證券代碼＋統一編號」配對傳進來（最多 200 筆，超過請分批送），呼叫端自行
 *       保證配對正確，本服務不驗證兩者是否真的對應同一家公司。陣列進到 gov 之後逐筆序列處理
 *       （不平行送），每一筆都用統編向 GCIS 商工登記資料查詢，把公司基本資料與完整營業項目清單
 *       存進 company_profiles / company_business_items。單一統編若已有資料，預設直接跳過、不打
 *       GCIS；帶 force=true 才會整批都重新抓取並覆寫（含 stockCode、營業項目整批刪除重建）。對
 *       GCIS 的請求本身有節流，同一 process 內每次呼叫至少間隔 1 秒，避免短時間連續打被暫時鎖——
 *       這也是逐筆序列處理而非平行處理的原因之一。對 GCIS 的請求失敗（連不上、非 200）會自動重試
 *       最多 2 次（間隔遞增 2s/4s）；「查無此統編」不算失敗，不會重試。單筆處理失敗（重試後仍失敗、
 *       stockCode 衝突等）不會中斷整批，會照實記錄在該筆的 result 裡，繼續處理下一筆。
 *     tags:
 *       - Ingestion
 *     security:
 *       - TaskSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 200
 *                 items:
 *                   type: object
 *                   required: [stockCode, taxId]
 *                   properties:
 *                     stockCode:
 *                       type: string
 *                       description: 證券代碼（4-6 碼英數字）
 *                       example: '2330'
 *                     taxId:
 *                       type: string
 *                       description: 統一編號（8 碼數字）
 *                       example: '22099131'
 *               force:
 *                 type: boolean
 *                 description: true 時整批都即使已有資料也強制重新向 GCIS 抓取並覆寫，預設 false
 *                 default: false
 *     responses:
 *       200:
 *         description: 批次處理完成，回傳整體統計（total/succeeded/skipped/failed）與逐筆 results。
 *       400:
 *         description: 請求格式錯誤（例如陣列為空、超過 200 筆、代碼格式不對）。
 */
router.post('/company-profile', registerCompanyProfileController);

export default router;
