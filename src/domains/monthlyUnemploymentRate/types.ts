// 官方檔案本來就這樣分組，教育程度幾類彼此有母子集關係（例如 edu_junior_high_and_below 包含
// edu_primary_school_and_below），這裡原樣保留全部類別，不做去重篩選。見 schema.prisma 的
// MonthlyUnemploymentRate model 註解。
export type UnemploymentCategory =
  | 'total'
  | 'male'
  | 'female'
  | 'age_15_19'
  | 'age_20_24'
  | 'age_25_29'
  | 'age_30_34'
  | 'age_35_39'
  | 'age_40_44'
  | 'age_45_49'
  | 'age_50_54'
  | 'age_55_59'
  | 'age_60_64'
  | 'age_65_over'
  | 'edu_junior_high_and_below'
  | 'edu_primary_school_and_below'
  | 'edu_junior_high'
  | 'edu_senior_high'
  | 'edu_college_and_above'
  | 'edu_junior_college'
  | 'edu_university_and_above';

export interface MonthlyUnemploymentRatePoint {
  year: number; // 西元年
  month: number; // 1-12
  category: UnemploymentCategory;
  ratePercent: number; // 失業率(%)
}
