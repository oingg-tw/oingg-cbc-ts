import prisma from '@/adapters/prisma/index';
import { fetchDgbasXml } from '@/adapters/dgbas/client';
import { parseMonthlyCpi } from '@/domains/monthlyCpi/parser';
import type { MonthlyCpiPoint } from '@/domains/monthlyCpi/types';

// 主計總處固定路徑統計檔案，沒有查詢參數，每次都回傳整段歷史（1981M01 至今）。
const CPI_XML_URL = 'https://ws.dgbas.gov.tw/001/Upload/461/relfile/11525/230555/pr0101a1m.xml';
const EXPORT_DATASET = 'monthly_cpi'; // 對應 export.monthly_cpi view

export interface IngestMonthlyCpiResult {
  success: boolean;
  totalPoints: number;
  fetched: number;
  skipped: number;
  error?: string;
}

// 跟 govBondYield10y 同樣的道理：analysis-ts 只認 export.ingestion_runs 裡 status='success' 的紀錄，
// 這是輔助性記帳動作，失敗不能讓主要 ingest 結果跟著失敗。
const recordIngestionRun = async (status: 'success' | 'failed', points: MonthlyCpiPoint[]): Promise<void> => {
  try {
    const latest = points.reduce<{ year: number; month: number } | null>((acc, p) => {
      if (!acc || p.year > acc.year || (p.year === acc.year && p.month > acc.month)) return { year: p.year, month: p.month };
      return acc;
    }, null);
    const dataDate = latest ? new Date(Date.UTC(latest.year, latest.month - 1, 1)) : new Date();

    await prisma.ingestionRun.create({
      data: { dataset: EXPORT_DATASET, dataDate, rowCount: points.length, status },
    });
  } catch (error) {
    console.error('Failed to record ingestion run for analysis-ts export contract:', error);
  }
};

// 跟 gov-bond-yield-10y 一樣，這個端點本身不分頁、一次請求就拿到整段月資料，逐點 upsert；force
// 控制已存在的 (year, month, category) 要不要覆寫——CPI 原始值理論上不會被事後修正，但主計總處偶爾
// 會回溯調整權數/基期，保留 force 供重跑時強制刷新。
export const ingestMonthlyCpi = async (force = false): Promise<IngestMonthlyCpiResult> => {
  let xml: string;
  try {
    xml = await fetchDgbasXml(CPI_XML_URL);
  } catch (error) {
    await recordIngestionRun('failed', []);
    return { success: false, totalPoints: 0, fetched: 0, skipped: 0, error: error instanceof Error ? error.message : String(error) };
  }

  let points: MonthlyCpiPoint[];
  try {
    points = parseMonthlyCpi(xml);
  } catch (error) {
    await recordIngestionRun('failed', []);
    return { success: false, totalPoints: 0, fetched: 0, skipped: 0, error: error instanceof Error ? error.message : String(error) };
  }

  let fetched = 0;
  let skipped = 0;
  for (const point of points) {
    const where = { year_month_category: { year: point.year, month: point.month, category: point.category } };

    if (!force) {
      const existing = await prisma.monthlyCpi.findUnique({ where });
      if (existing) {
        skipped++;
        continue;
      }
    }

    await prisma.monthlyCpi.upsert({
      where,
      create: { year: point.year, month: point.month, category: point.category, indexValue: point.indexValue, yoyChangePercent: point.yoyChangePercent },
      update: { indexValue: point.indexValue, yoyChangePercent: point.yoyChangePercent },
    });
    fetched++;
  }

  await recordIngestionRun('success', points);
  return { success: true, totalPoints: points.length, fetched, skipped };
};
