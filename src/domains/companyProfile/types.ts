import type { CompanyProfile, CompanyBusinessItem } from '@prisma/client';

export type CompanyProfileWithBusinessItems = CompanyProfile & {
  businessItems: CompanyBusinessItem[];
};

export interface RegisterCompanyProfileResult {
  success: boolean;
  profile?: CompanyProfileWithBusinessItems;
  notFound?: boolean; // GCIS 查無此統編（跟「呼叫 GCIS 失敗」的 502 區分開來）
  error?: string;
}
