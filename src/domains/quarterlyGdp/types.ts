// 官方原始檔案只有 12 個項目（不像 CPI 有 81 個細項要篩選），全部保留。見 schema.prisma 的
// QuarterlyGdp model 註解。
export type GdpCategory =
  | 'growth_rate' // 經濟成長率
  | 'domestic_demand_total' // 國內需求-小計
  | 'private_consumption' // 國內需求-民間消費
  | 'government_consumption' // 國內需求-政府消費
  | 'fixed_capital_formation_total' // 國內需求-固定資本形成
  | 'fixed_capital_formation_private' // 國內需求-固定資本形成-民間
  | 'fixed_capital_formation_public_enterprise' // 國內需求-固定資本形成-公營
  | 'fixed_capital_formation_government' // 國內需求-固定資本形成-政府
  | 'inventory_change' // 國內需求-存貨變動
  | 'net_external_demand_total' // 國外淨需求-小計
  | 'exports' // 國外淨需求-商品及服務輸出
  | 'imports'; // 國外淨需求-減：商品及服務輸入

export interface QuarterlyGdpPoint {
  year: number; // 西元年
  quarter: number; // 1-4
  category: GdpCategory;
  contributionPoints: number | null; // 原始值（百分點貢獻度）
  yoyChangePercent: number | null; // 年增率(%)
}
