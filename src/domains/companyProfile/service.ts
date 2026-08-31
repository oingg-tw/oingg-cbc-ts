import { Prisma } from '@prisma/client';
import prisma from '../../adapters/prisma/index';
import { fetchCompanyBusinessItems } from '../../adapters/gcis';
import type { RegisterCompanyProfileResult, CompanyProfileWithBusinessItems } from './types';

export const registerCompanyProfile = async (stockCode: string, taxId: string, force = false): Promise<RegisterCompanyProfileResult> => {
  if (!force) {
    // 包 try/catch 是因為這個 function 會在批次 ingest 的迴圈裡被逐筆呼叫（見
    // companyProfile/controller.ts）：這裡如果不接住例外直接往外丟，會讓單一統編的 DB 查詢失敗
    // 中斷整批後面還沒處理的項目，而不是只記那一筆失敗、繼續跑下一筆。
    try {
      const existing = await prisma.companyProfile.findUnique({
        where: { taxId },
        include: { businessItems: { orderBy: { seqNo: 'asc' } } },
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
      await tx.companyBusinessItem.deleteMany({ where: { taxId } });
      await tx.companyBusinessItem.createMany({
        data: record.Cmp_Business.map((item) => ({
          taxId,
          seqNo: item.Business_Seq_NO,
          itemCode: item.Business_Item.trim() === '' ? null : item.Business_Item,
          itemDesc: item.Business_Item_Desc,
        })),
      });

      return tx.companyProfile.findUniqueOrThrow({
        where: { taxId },
        include: { businessItems: { orderBy: { seqNo: 'asc' } } },
      });
    });

    return { success: true, profile };
  } catch (error) {
    // stockCode 設了 @unique：同一證券代碼已經登記在別的統編下時，Prisma 丟 P2002，轉成好懂的錯誤訊息。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: `證券代碼 ${stockCode} 已登記在其他統編下，無法重複登記。` };
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const getCompanyProfileByTaxId = (taxId: string): Promise<CompanyProfileWithBusinessItems | null> => {
  return prisma.companyProfile.findUnique({
    where: { taxId },
    include: { businessItems: { orderBy: { seqNo: 'asc' } } },
  });
};

export const getCompanyProfileByStockCode = (stockCode: string): Promise<CompanyProfileWithBusinessItems | null> => {
  return prisma.companyProfile.findUnique({
    where: { stockCode },
    include: { businessItems: { orderBy: { seqNo: 'asc' } } },
  });
};
