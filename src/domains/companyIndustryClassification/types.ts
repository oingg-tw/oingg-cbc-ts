export interface IngestCompanyIndustryClassificationResult {
  success: boolean;
  targetCount: number; // company_profiles 裡有多少家在追蹤
  matched: number; // 財政部稅籍登記資料裡找到總公司登記列、且行業代號能對到 tax_industry_classification 的家數
  notFoundInRegistry: number; // 財政部檔案裡完全沒有這個統編的總公司登記列
  invalidIndustryCode: number; // 有找到登記列，但行業代號對不到 tax_industry_classification 任何一筆
  error?: string;
}
