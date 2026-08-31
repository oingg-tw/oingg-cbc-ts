import prisma from '../../adapters/prisma/index';
import { fetchCbcItem } from '../../adapters/cbc';
import { parseMonthlyGovBondYield10y } from './parser';

const ITEM_CODE = 'EG43M01en';

export interface IngestGovBondYield10yResult {
  success: boolean;
  totalPoints: number;
  fetched: number;
  skipped: number;
  error?: string;
}

// CBC 這個端點本身不分頁、不需要重複請求，一次請求就拿到 1987-M5 至今整段月資料，逐月 upsert；
// force 控制已存在的月份要不要覆寫（次級市場殖利率是歷史成交事實，理論上不會被事後修正，但保留
// force 跟 MonthlyCpi domain 的做法一致，方便重跑時強制刷新）。
export const ingestMonthlyGovBondYield10y = async (force = false): Promise<IngestGovBondYield10yResult> => {
  let raw;
  try {
    raw = await fetchCbcItem(ITEM_CODE);
  } catch (error) {
    return { success: false, totalPoints: 0, fetched: 0, skipped: 0, error: error instanceof Error ? error.message : String(error) };
  }

  let points;
  try {
    points = parseMonthlyGovBondYield10y(raw);
  } catch (error) {
    return { success: false, totalPoints: 0, fetched: 0, skipped: 0, error: error instanceof Error ? error.message : String(error) };
  }

  let fetched = 0;
  let skipped = 0;
  for (const point of points) {
    const where = { year_month: { year: point.year, month: point.month } };

    if (!force) {
      const existing = await prisma.monthlyGovBondYield10y.findUnique({ where });
      if (existing) {
        skipped++;
        continue;
      }
    }

    await prisma.monthlyGovBondYield10y.upsert({
      where,
      create: { year: point.year, month: point.month, yieldRate: point.yieldRate },
      update: { yieldRate: point.yieldRate },
    });
    fetched++;
  }

  return { success: true, totalPoints: points.length, fetched, skipped };
};
