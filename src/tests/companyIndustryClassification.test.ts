import { describe, it, expect } from 'vitest';
import { toSubclassCode } from '@/domains/companyIndustryClassification/service';

describe('toSubclassCode', () => {
  it('converts a 6-digit FIA code into tax_industry_classification subclass format', () => {
    // 已用亞洲水泥(統編03244509)實測驗證過：財政部登記的 "233100" 對到 "2331-00"「水泥製造」，
    // 跟實際主業完全吻合，不是巧合對上的（見 service.ts 的註解）。
    expect(toSubclassCode('233100')).toBe('2331-00');
  });

  it('converts codes ending in a non-zero suffix correctly', () => {
    expect(toSubclassCode('472927')).toBe('4729-27');
  });

  it('returns null for a code that is not exactly 6 digits', () => {
    expect(toSubclassCode('12345')).toBeNull();
    expect(toSubclassCode('1234567')).toBeNull();
  });

  it('returns null for a non-numeric code', () => {
    expect(toSubclassCode('C')).toBeNull();
    expect(toSubclassCode('')).toBeNull();
  });
});
