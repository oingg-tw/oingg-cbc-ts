export interface IngestCompanyIndustryClassificationResult {
  success: boolean;
  targetCount: number; // company_profiles 裡有多少家在追蹤
  matched: number; // 財政部稅籍登記資料裡找到總公司登記列、且至少一組行業代號能對到 tax_industry_classification 的家數（一家公司最多寫入 4 列，這裡算的是「家」不是「列」）
  notFoundInRegistry: number; // 財政部檔案裡完全沒有這個統編的總公司登記列
  invalidIndustryCode: number; // 有找到登記列，但列裡所有行業代號（主要+次要）都無法對到 tax_industry_classification 任何一筆
  totalClassificationRows: number; // 實際寫入 company_industry_classifications 的列數（含次要行業代號，>= matched）
  error?: string;
}
