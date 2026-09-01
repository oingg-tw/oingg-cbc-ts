import { describe, it, expect } from 'vitest';
import { dedupeBusinessItems } from '../domains/companyProfile/dedupe';
import type { GcisCompanyBusinessItem } from '../adapters/gcis';

const item = (seqNo: string, code: string, desc: string): GcisCompanyBusinessItem => ({
  Business_Seq_NO: seqNo,
  Business_Item: code,
  Business_Item_Desc: desc,
});

describe('dedupeBusinessItems', () => {
  it('removes an exact duplicate row (same seqNo/code/desc), keeping the first occurrence', () => {
    // 實測驗證過的真實案例：雲豹能源科技(統編42852207)56 筆原始資料其實只有 28 個不重複項目，
    // GCIS 自己的回應把每一筆整列重複兩次。
    const items = [item('0001', 'CC01010', '發電、輸電、配電機械製造業'), item('0001', 'CC01010', '發電、輸電、配電機械製造業')];
    expect(dedupeBusinessItems(items)).toEqual([item('0001', 'CC01010', '發電、輸電、配電機械製造業')]);
  });

  it('keeps rows that share a seqNo but differ in code or description (not a true duplicate)', () => {
    // Business_Seq_NO 本身不保證唯一（見 schema.prisma 對 CompanyBusinessItem.position 的註解），
    // 所以去重鍵一定要是 seqNo+code+desc 三個欄位的組合，不能只看 seqNo。
    const items = [item('0001', 'CC01010', 'A業'), item('0001', 'CC01020', 'B業')];
    expect(dedupeBusinessItems(items)).toEqual(items);
  });

  it('keeps free-text narrative rows even when Business_Item is blank for all of them', () => {
    const items = [item('0011', '       ', '依客戶之訂單...'), item('0012', '       ', '提供封裝與測試服務。')];
    expect(dedupeBusinessItems(items)).toEqual(items);
  });

  it('preserves original order and returns an empty array for empty input', () => {
    const items = [item('0003', 'X', 'third'), item('0001', 'Y', 'first'), item('0002', 'Z', 'second')];
    expect(dedupeBusinessItems(items).map((i) => i.Business_Seq_NO)).toEqual(['0003', '0001', '0002']);
    expect(dedupeBusinessItems([])).toEqual([]);
  });
});
