import { Router } from 'ultimate-express';
import { ingestQuarterlyGdpController } from '@/domains/quarterlyGdp/controller';

const router = Router();

/**
 * @swagger
 * /api/ingest/quarterly-gdp:
 *   post:
 *     summary: 向主計總處抓取國民所得統計－GDP貢獻度－依支出分季資料
 *     description: >
 *       透過主計總處固定路徑統計檔案（無正式 REST API，只能整份下載）抓取，涵蓋經濟成長率本身，
 *       加上國內需求（民間消費/政府消費/固定資本形成〈民間/公營/政府〉/存貨變動）跟國外淨需求
 *       （商品及服務輸出/進口）共 12 個項目，官方原始檔案就只有這 12 個，全部保留（不像 CPI 要從
 *       81 個細項篩選）。
 *
 *       單次請求就回傳 1981Q1 至今整段季資料，每個項目同時有「原始值」（百分點貢獻度）跟「年增率(%)」
 *       兩種數值，合併存成同一列。依 (year, quarter, category) 為主鍵；已存在且未帶 force 就跳過，
 *       不覆寫。
 *     tags:
 *       - Ingestion
 *     security:
 *       - TaskSecret: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 description: "true 時即使資料庫已有該 (年季,類別) 也強制覆寫，預設 false"
 *                 default: false
 *     responses:
 *       200:
 *         description: 抓取完成，回傳總筆數、實際寫入筆數與跳過筆數。
 *       400:
 *         description: 請求的參數格式錯誤。
 *       502:
 *         description: 向主計總處抓取或解析失敗。
 */
router.post('/quarterly-gdp', ingestQuarterlyGdpController);

export default router;
