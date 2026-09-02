import { Router } from 'ultimate-express';
import { ingestMonthlyBusinessCycleIndicatorController } from '@/domains/monthlyBusinessCycleIndicator/controller';

const router = Router();

/**
 * @swagger
 * /api/ingest/monthly-business-cycle-indicator:
 *   post:
 *     summary: 向國發會抓取景氣指標及燈號月資料
 *     description: >
 *       透過國發會固定路徑 ZIP 檔案（無正式 REST API，只能整份下載）抓取，ZIP 裡有 11 個檔案，這裡
 *       只解析主檔「景氣指標與燈號.csv」——領先/同時/落後指標的綜合指數與不含趨勢指數、景氣對策信號
 *       綜合分數與燈號（紅/黃紅/綠/黃藍/藍文字原文）。ZIP 裡另外 4 個「構成項目」CSV（M1B、股價指數、
 *       失業率等細項）暫不解析。
 *
 *       單次請求就回傳 1982-01 至今整段月資料。依 (year, month) 為主鍵；已存在且未帶 force 就跳過，
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
 *                 description: "true 時即使資料庫已有該年月也強制覆寫，預設 false"
 *                 default: false
 *     responses:
 *       200:
 *         description: 抓取完成，回傳總筆數、實際寫入筆數與跳過筆數。
 *       400:
 *         description: 請求的參數格式錯誤。
 *       502:
 *         description: 向國發會抓取或解析失敗。
 */
router.post('/monthly-business-cycle-indicator', ingestMonthlyBusinessCycleIndicatorController);

export default router;
