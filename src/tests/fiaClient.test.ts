import { describe, it, expect } from 'vitest';
import { parseFiaBusinessTaxRegistryLine } from '@/adapters/fia/client';

describe('parseFiaBusinessTaxRegistryLine', () => {
  it('parses a headquarters row (統一編號=自己、總機構統一編號=空白)', () => {
    const line = '"臺北市大安區敦化南路２段２０７號３０至３１樓",03244509,,"亞洲水泥股份有限公司",35465628810,0750120,股份有限公司,Y,233100,水泥製造,,,,,,';
    const row = parseFiaBusinessTaxRegistryLine(line);
    expect(row).toEqual({
      address: '臺北市大安區敦化南路２段２０７號３０至３１樓',
      taxId: '03244509',
      headOfficeTaxId: '',
      businessName: '亞洲水泥股份有限公司',
      industryCodes: [{ code: '233100', name: '水泥製造' }],
    });
  });

  it('parses a branch row (總機構統一編號 points at the HQ tax ID)', () => {
    const line = '"新竹縣橫山鄉大肚村中豐路２段１０９號",48300028,03244509,"亞洲水泥股份有限公司新竹製造廠",0,0460321,其他,Y,233100,水泥製造,,,,,,';
    const row = parseFiaBusinessTaxRegistryLine(line);
    expect(row?.taxId).toBe('48300028');
    expect(row?.headOfficeTaxId).toBe('03244509');
  });

  it('handles an escaped double-quote inside a quoted field', () => {
    const line = '"某路１號""A棟""",12345678,,"測試商行",1000,1010101,獨資,N,472913,菸酒零售,,,,,,';
    const row = parseFiaBusinessTaxRegistryLine(line);
    expect(row?.address).toBe('某路１號"A棟"');
  });

  it('collects secondary industry codes (行業代號1/2/3) when present, in original order', () => {
    // 實測驗證（統編22099131台積電）：主要+兩個次要行業代號都在同一列裡，不是三筆不同的登記列。
    const line = '"新竹市東　區科園里科學園區力行六路８號",22099131,,"台灣積體電路製造股份有限公司",259323700670,0760321,股份有限公司,Y,261199,其他積體電路製造,261111,矽晶圓製造,282011,一次電池製造,,';
    const row = parseFiaBusinessTaxRegistryLine(line);
    expect(row?.industryCodes).toEqual([
      { code: '261199', name: '其他積體電路製造' },
      { code: '261111', name: '矽晶圓製造' },
      { code: '282011', name: '一次電池製造' },
    ]);
  });

  it('skips blank secondary code slots instead of including empty entries', () => {
    // 實測發現：常見情況是只有第一組次要代號有值，第二、三組是空字串（不是每家公司都有到三個次業）。
    const line = '"南投縣中寮鄉中寮村鄉林巷４３號",61194605,,"和興商店",1000,0400711,獨資,N,472913,菸酒零售,471913,雜貨店,,,,';
    const row = parseFiaBusinessTaxRegistryLine(line);
    expect(row?.industryCodes).toEqual([
      { code: '472913', name: '菸酒零售' },
      { code: '471913', name: '雜貨店' },
    ]);
  });

  it('returns null when the tax ID is not 8 digits', () => {
    const line = '"某地址",1234567,,"某商行",1000,1010101,獨資,N,472913,菸酒零售,,,,,,';
    expect(parseFiaBusinessTaxRegistryLine(line)).toBeNull();
  });

  it('returns null when the primary industry code is blank', () => {
    const line = '"某地址",12345678,,"某商行",1000,1010101,獨資,N,,,,,,,,';
    expect(parseFiaBusinessTaxRegistryLine(line)).toBeNull();
  });

  it('returns null for the file-generation timestamp row that occasionally appears in the CSV', () => {
    // 實測發現這份檔案裡偶爾會出現一列像 "01-SEP-26,,,,,,,,,,,,,,," 這種產生時間戳記，不是真的登記資料。
    const line = '01-SEP-26,,,,,,,,,,,,,,,';
    expect(parseFiaBusinessTaxRegistryLine(line)).toBeNull();
  });

  it('returns null when there are too few fields', () => {
    expect(parseFiaBusinessTaxRegistryLine('a,b,c')).toBeNull();
  });
});
