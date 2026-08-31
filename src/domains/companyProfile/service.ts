import { Prisma } from '@prisma/client';
import type { CompanyProfileIngestionFailure } from '@prisma/client';
import prisma from '../../adapters/prisma/index';
import { fetchCompanyBusinessItems } from '../../adapters/gcis';
import type { RegisterCompanyProfileResult, CompanyProfileWithBusinessItems } from './types';

// company_profile_ingestion_failures 只記「目前還沒成功過的統編」：失敗就 upsert（累加 attempts、
// 更新錯誤訊息），成功（不論新登記還是 skip 既有資料）就把該統編的紀錄刪掉。這裡包 try/catch 是
// 因為這是輔助性的記帳動作，記錄本身失敗（例如 DB 瞬斷）不該讓 registerCompanyProfile 原本已經
// 拿到的成功/失敗結果被蓋掉——最多印錯誤、結果照樣回傳。
const recordIngestionOutcome = async (stockCode: string, taxId: string, result: RegisterCompanyProfileResult): Promise<void> => {
  try {
    if (result.success) {
      await prisma.companyProfileIngestionFailure.deleteMany({ where: { taxId } });
    } else {
      await prisma.companyProfileIngestionFailure.upsert({
        where: { taxId },
        create: { taxId, stockCode, error: result.error ?? 'Unknown error' },
        update: { stockCode, error: result.error ?? 'Unknown error', attempts: { increment: 1 } },
      });
    }
  } catch (error) {
    console.error('Failed to record company profile ingestion outcome:', error);
  }
};

export const registerCompanyProfile = async (stockCode: string, taxId: string, force = false): Promise<RegisterCompanyProfileResult> => {
  const result = await registerCompanyProfileCore(stockCode, taxId, force);
  await recordIngestionOutcome(stockCode, taxId, result);
  return result;
};

const registerCompanyProfileCore = async (stockCode: string, taxId: string, force: boolean): Promise<RegisterCompanyProfileResult> => {
  if (!force) {
    // 包 try/catch 是因為這個 function 會在批次 ingest 的迴圈裡被逐筆呼叫（見
    // companyProfile/controller.ts）：這裡如果不接住例外直接往外丟，會讓單一統編的 DB 查詢失敗
    // 中斷整批後面還沒處理的項目，而不是只記那一筆失敗、繼續跑下一筆。
    try {
      const existing = await prisma.companyProfile.findUnique({
        where: { taxId },
        include: { businessItems: { orderBy: { position: 'asc' } } },
      });
      // 已經有資料就跳過，不打 GCIS——這條路刻意不檢查 stockCode 是否跟既有資料一致，帶 force=true
      // 才會真的重新抓取並覆寫（包含 stockCode）。
      if (existing) return { success: true, profile: existing, skipped: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  let records;
  try {
    records = await fetchCompanyBusinessItems(taxId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }

  const record = records[0];
  if (!record) {
    return { success: false, notFound: true, error: `GCIS 查無統編 ${taxId} 的公司登記資料。` };
  }

  try {
    const profile = await prisma.$transaction(async (tx) => {
      await tx.companyProfile.upsert({
        where: { taxId },
        create: {
          taxId,
          stockCode,
          companyName: record.Company_Name,
          companyStatus: record.Company_Status,
          companyStatusDesc: record.Company_Status_Desc,
          companySetupDate: record.Company_Setup_Date,
        },
        update: {
          stockCode,
          companyName: record.Company_Name,
          companyStatus: record.Company_Status,
          companyStatusDesc: record.Company_Status_Desc,
          companySetupDate: record.Company_Setup_Date,
        },
      });

      // GCIS 回應是「當下完整清單」而非增量，整批刪除重建比逐筆比對更新簡單也更不容易留下髒資料。
      //
      // 實測發現（雲豹能源科技 42852207 等）：不少公司的回應裡，每一筆營業項目會原封不動出現兩次
      // ——不是序號剛好撞在一起，是 seqNo/itemCode/itemDesc 三個欄位完全一樣的整列重複。這是 GCIS
      // 自己回應內容的問題，不是我們解析錯；直接照登會讓同一個項目在 DB 裡出現兩次。用
      // seqNo+itemCode+itemDesc 三個欄位的組合去重，只保留第一次出現的那筆。
      const seenKeys = new Set<string>();
      const dedupedItems = record.Cmp_Business.filter((item) => {
        const key = `${item.Business_Seq_NO}|${item.Business_Item}|${item.Business_Item_Desc}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      await tx.companyBusinessItem.deleteMany({ where: { taxId } });
      await tx.companyBusinessItem.createMany({
        data: dedupedItems.map((item, position) => ({
          taxId,
          position, // 陣列索引（去重後），不是 Business_Seq_NO——後者實測會重複，見 schema.prisma 註解
          seqNo: item.Business_Seq_NO,
          itemCode: item.Business_Item.trim() === '' ? null : item.Business_Item,
          itemDesc: item.Business_Item_Desc,
        })),
      });

      return tx.companyProfile.findUniqueOrThrow({
        where: { taxId },
        include: { businessItems: { orderBy: { position: 'asc' } } },
      });
    });

    return { success: true, profile };
  } catch (error) {
    // P2002 可能來自兩個不同的 unique constraint，不能一律當成 stockCode 衝突（之前這裡曾經
    // 不分青紅皂白都回「證券代碼已登記在其他統編下」，結果 company_business_items 的
    // (tax_id, position) 撞到時也被貼上同一個誤導訊息）——用 error.meta.target 分辨是哪個欄位。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[] | string | undefined) ?? [];
      const targetsStockCode = Array.isArray(target) ? target.includes('stock_code') : target === 'stock_code';
      if (targetsStockCode) {
        return { success: false, error: `證券代碼 ${stockCode} 已登記在其他統編下，無法重複登記。` };
      }
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const getCompanyProfileByTaxId = (taxId: string): Promise<CompanyProfileWithBusinessItems | null> => {
  return prisma.companyProfile.findUnique({
    where: { taxId },
    include: { businessItems: { orderBy: { position: 'asc' } } },
  });
};

export const getCompanyProfileByStockCode = (stockCode: string): Promise<CompanyProfileWithBusinessItems | null> => {
  return prisma.companyProfile.findUnique({
    where: { stockCode },
    include: { businessItems: { orderBy: { position: 'asc' } } },
  });
};

export const listCompanyProfileIngestionFailures = (): Promise<CompanyProfileIngestionFailure[]> => {
  return prisma.companyProfileIngestionFailure.findMany({ orderBy: { updatedAt: 'desc' } });
};

export interface RegisteredStockCode {
  stockCode: string;
  taxId: string;
  businessItemCount: number;
  updatedAt: Date;
}

// 給 TWSE（或其他外部系統）打的清單端點：只回傳「有哪些證券代碼已經有營業項目」，不含完整營業項目
// 內容——要看細節請用 GET /api/query/company-profile/stock-code/:stockCode 個別查。company_profiles
// 裡有資料就代表 businessItems 一定有（兩者是同一個 $transaction 一起寫入的，見 registerCompanyProfile），
// 所以不用另外檢查 businessItems 是否為空。
export const listRegisteredStockCodes = async (): Promise<RegisteredStockCode[]> => {
  const profiles = await prisma.companyProfile.findMany({
    select: { stockCode: true, taxId: true, updatedAt: true, _count: { select: { businessItems: true } } },
    orderBy: { stockCode: 'asc' },
  });
  return profiles.map((p) => ({ stockCode: p.stockCode, taxId: p.taxId, businessItemCount: p._count.businessItems, updatedAt: p.updatedAt }));
};
