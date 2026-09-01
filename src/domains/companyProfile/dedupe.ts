import type { GcisCompanyBusinessItem } from '../../adapters/gcis';

// GCIS 回應裡，不少公司的營業項目會整列重複兩次——不是序號剛好撞在一起，是 seqNo/itemCode/itemDesc
// 三個欄位完全一樣的整列重複（實測驗證，見雲豹能源科技 42852207：56 筆原始資料其實只有 28 個不重複
// 項目）。這是 GCIS 自己回應內容的問題，不是解析錯；直接照登會讓同一個項目在 DB 裡出現兩次。用
// seqNo+itemCode+itemDesc 三個欄位的組合去重，只保留第一次出現的那筆，不改變原始順序。
export const dedupeBusinessItems = (items: GcisCompanyBusinessItem[]): GcisCompanyBusinessItem[] => {
  const seenKeys = new Set<string>();
  return items.filter((item) => {
    const key = `${item.Business_Seq_NO}|${item.Business_Item}|${item.Business_Item_Desc}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
};
