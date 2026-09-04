import { z } from 'zod';

// 五個「單次請求就拿到整段歷史，逐筆用唯一鍵決定要不要覆寫」的 domain（govBondYield10y/
// monthlyCpi/quarterlyGdp/monthlyUnemploymentRate/monthlyBusinessCycleIndicator）共用同一種
// request body 形狀，只有一個 force 旗標，抽出來共用一份 schema——同一份物件同時給各自的
// controller.ts 驗證跟 route.ts 出 OpenAPI 文件用，不會有「文件寫的欄位」跟「實際接受的欄位」
// 對不起來的風險，也不用五個 domain 各自重複定義同一個 schema。
export const forceIngestBodySchema = z.object({
  force: z.boolean().optional().default(false),
});
