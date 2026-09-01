import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import prisma from '../../adapters/prisma/index';
import { FIA_BUSINESS_TAX_REGISTRY_CSV_URL, parseFiaBusinessTaxRegistryLine } from '../../adapters/fia/client';
import type { IngestCompanyIndustryClassificationResult } from './types';

const EXPORT_DATASET = 'company_industry_classification'; // 對應 export.company_industry_classification view

// 跟 govBondYield10y 同樣的道理：analysis-ts 只認 export.ingestion_runs 裡 status='success' 的紀錄，
// 這是輔助性記帳動作，失敗不能讓主要 ingest 結果跟著失敗。
const recordIngestionRun = async (status: 'success' | 'failed', rowCount: number): Promise<void> => {
  try {
    await prisma.ingestionRun.create({
      data: { dataset: EXPORT_DATASET, dataDate: new Date(), rowCount, status },
    });
  } catch (error) {
    console.error('Failed to record ingestion run for analysis-ts export contract:', error);
  }
};

// 財政部原始代碼是 6 碼數字（例如 "233100"），tax_industry_classification 的 subclass 代碼格式是
// 前4碼-後2碼（例如 "2331-00"）——已用亞洲水泥(統編03244509)實測驗證過這個轉換規則跟真實資料對得起來
// （"233100" 對到 "2331-00" 水泥製造，符合實際主業）。
export const toSubclassCode = (raw: string): string | null => {
  if (!/^\d{6}$/.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
};

interface RegistryMatch {
  taxId: string;
  industryCode: string; // 已轉換成 subclass 格式
  sourceIndustryName: string;
  registeredAddress: string;
}

// 全國稅籍登記檔（約322MB、171萬列）用串流逐行處理，不整份載進記憶體——只在乎 targetTaxIds 這個小
// 集合，其餘列邊讀邊丟。回傳每個統編找到的「總公司本身」那一列（統一編號=自己、總機構統一編號=空白）。
const streamMatchRegistry = async (targetTaxIds: Set<string>): Promise<Map<string, RegistryMatch>> => {
  const response = await fetch(FIA_BUSINESS_TAX_REGISTRY_CSV_URL);
  if (!response.ok || !response.body) {
    throw new Error(`FIA 稅籍登記資料下載失敗：HTTP ${response.status}`);
  }

  const matches = new Map<string, RegistryMatch>();
  const rl = createInterface({ input: Readable.fromWeb(response.body as any), crlfDelay: Infinity });

  let isFirstLine = true;
  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false; // 跳過表頭
      continue;
    }
    if (matches.size >= targetTaxIds.size) break; // 已經找齊全部目標，不用把整份檔案讀完

    const row = parseFiaBusinessTaxRegistryLine(line);
    if (!row) continue;
    if (row.headOfficeTaxId !== '') continue; // 只要總公司本身的登記列，不要分公司/廠
    if (!targetTaxIds.has(row.taxId)) continue;
    if (matches.has(row.taxId)) continue; // 理論上總公司列唯一，保險起見只取第一筆

    const industryCode = toSubclassCode(row.primaryIndustryCode);
    if (!industryCode) continue;

    matches.set(row.taxId, {
      taxId: row.taxId,
      industryCode,
      sourceIndustryName: row.primaryIndustryName,
      registeredAddress: row.address,
    });
  }

  return matches;
};

export const ingestCompanyIndustryClassification = async (): Promise<IngestCompanyIndustryClassificationResult> => {
  const targetProfiles = await prisma.companyProfile.findMany({ select: { taxId: true } });
  const targetTaxIds = new Set(targetProfiles.map((p) => p.taxId));

  if (targetTaxIds.size === 0) {
    return { success: true, targetCount: 0, matched: 0, notFoundInRegistry: 0, invalidIndustryCode: 0 };
  }

  let registryMatches: Map<string, RegistryMatch>;
  try {
    registryMatches = await streamMatchRegistry(targetTaxIds);
  } catch (error) {
    await recordIngestionRun('failed', 0);
    return {
      success: false,
      targetCount: targetTaxIds.size,
      matched: 0,
      notFoundInRegistry: 0,
      invalidIndustryCode: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 只驗證真的用到的代碼，不用把全部 2,466 筆分類代碼都撈出來。
  const usedCodes = [...new Set([...registryMatches.values()].map((m) => m.industryCode))];
  const validClassifications = await prisma.taxIndustryClassification.findMany({
    where: { code: { in: usedCodes } },
    select: { code: true },
  });
  const validCodes = new Set(validClassifications.map((c) => c.code));

  let matched = 0;
  let invalidIndustryCode = 0;
  for (const match of registryMatches.values()) {
    if (!validCodes.has(match.industryCode)) {
      invalidIndustryCode++;
      continue;
    }
    await prisma.companyIndustryClassification.upsert({
      where: { taxId: match.taxId },
      create: {
        taxId: match.taxId,
        industryCode: match.industryCode,
        sourceIndustryName: match.sourceIndustryName,
        registeredAddress: match.registeredAddress,
      },
      update: {
        industryCode: match.industryCode,
        sourceIndustryName: match.sourceIndustryName,
        registeredAddress: match.registeredAddress,
      },
    });
    matched++;
  }

  const notFoundInRegistry = targetTaxIds.size - registryMatches.size;

  await recordIngestionRun('success', matched);
  return { success: true, targetCount: targetTaxIds.size, matched, notFoundInRegistry, invalidIndustryCode };
};
