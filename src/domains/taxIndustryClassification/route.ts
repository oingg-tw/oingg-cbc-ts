import { Router } from 'ultimate-express';
import { listTaxIndustryClassificationController, getTaxIndustryClassificationController } from '@/domains/taxIndustryClassification/controller';

const router = Router();

/**
 * @swagger
 * /api/query/tax-industry-classification:
 *   get:
 *     summary: 查詢財政部稅務行業標準分類代碼字典
 *     description: >
 *       讀取一次性 seed 進 DB 的《中華民國稅務行業標準分類（第9次修訂）》，一列對應五層階層
 *       （大/中/小/細/子類）中的一個節點。所有篩選條件皆可省略且彼此為 AND 條件；全部省略時
 *       回傳整張表（2,466 列）。
 *     tags:
 *       - Query
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [section, division, group, class, subclass]
 *         description: 只回傳指定階層（大/中/小/細/子類）的節點
 *       - in: query
 *         name: sectionCode
 *         schema:
 *           type: string
 *         description: 只回傳屬於此大類代碼底下的節點（例如 'K' = 金融及保險業）
 *       - in: query
 *         name: divisionCode
 *         schema:
 *           type: string
 *         description: 只回傳屬於此中類代碼底下的節點
 *       - in: query
 *         name: groupCode
 *         schema:
 *           type: string
 *         description: 只回傳屬於此小類代碼底下的節點
 *       - in: query
 *         name: classCode
 *         schema:
 *           type: string
 *         description: 只回傳屬於此細類代碼底下的節點
 *     responses:
 *       200:
 *         description: 符合條件的分類節點列表。
 *       400:
 *         description: 查詢參數格式錯誤。
 */
router.get('/tax-industry-classification', listTaxIndustryClassificationController);

/**
 * @swagger
 * /api/query/tax-industry-classification/{code}:
 *   get:
 *     summary: 依代碼查詢單一稅務行業標準分類節點
 *     description: 用節點自身的代碼（大類 1 碼英文字母、中類 2 碼數字、小類 3 碼、細類 4 碼、子類「4碼-2碼」）查詢單一節點。
 *     tags:
 *       - Query
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 節點代碼
 *         example: '0111'
 *     responses:
 *       200:
 *         description: 該代碼對應的分類節點。
 *       404:
 *         description: 查無此代碼。
 */
router.get('/tax-industry-classification/:code', getTaxIndustryClassificationController);

export default router;
