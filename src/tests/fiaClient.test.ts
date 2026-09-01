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
      primaryIndustryCode: '233100',
      primaryIndustryName: '水泥製造',
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
