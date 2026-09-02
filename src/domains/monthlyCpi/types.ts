// 只收「總指數」跟七大類指數（一~七），不收主計總處原始檔案裡完整的 81 個子項目（例如「米類及其
// 製品」「生鮮家畜」這種細到菜籃子等級的分類）——這個服務的用途是總經篩選因子，不是 CPI 籃子研究，
// 七大類已經夠支撐「原物料/內需股」這種類股輪動判斷（見 DATA-GOV-TW-SURVEY.md），存全部 81 項只會
// 讓一次 ingest 從 ~8,752 筆膨脹到 ~88,614 筆，換不到對應的使用場景。
export type CpiCategory =
  | 'total' // 總指數
  | 'food' // 一.食物類
  | 'clothing' // 二.衣著類
  | 'housing' // 三.居住類
  | 'transport_communication' // 四.交通及通訊類
  | 'medical' // 五.醫藥保健類
  | 'education_recreation' // 六.教養娛樂類
  | 'misc'; // 七.雜項類

export interface MonthlyCpiPoint {
  year: number; // 西元年
  month: number; // 1-12
  category: CpiCategory;
  indexValue: number | null; // 原始值（指數，基期見官方檔案標註，目前是民國110年=100；官方之後改基期年時這裡的數字含義會跟著變，不在這裡處理換基期）
  yoyChangePercent: number | null; // 年增率(%)；資料起始年份附近常缺值（沒有前一年可比較），null 是真的缺值，不是 0
}
