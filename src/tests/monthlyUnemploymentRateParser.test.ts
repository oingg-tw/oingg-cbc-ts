import { describe, it, expect } from 'vitest';
import { parseMonthlyUnemploymentRate } from '@/domains/monthlyUnemploymentRate/parser';

describe('parseMonthlyUnemploymentRate', () => {
  it('parses a real monthly record shape (subset of fields) into points', () => {
    const xml = `<DataCollection>
  <失業率>
    <年月別_Year_and_month>1978M01</年月別_Year_and_month>
    <總計_Total_百分比>2.01</總計_Total_百分比>
    <男_Male_百分比>1.82</男_Male_百分比>
    <age_15-19_百分比>5.01</age_15-19_百分比>
    <age_65_over_百分比>0.73</age_65_over_百分比>
    <國中及以下_Junior_high_and_below_百分比>1.41</國中及以下_Junior_high_and_below_百分比>
  </失業率>
</DataCollection>`;
    const points = parseMonthlyUnemploymentRate(xml);
    expect(points).toEqual(
      expect.arrayContaining([
        { year: 1978, month: 1, category: 'total', ratePercent: 2.01 },
        { year: 1978, month: 1, category: 'male', ratePercent: 1.82 },
        { year: 1978, month: 1, category: 'age_15_19', ratePercent: 5.01 },
        { year: 1978, month: 1, category: 'age_65_over', ratePercent: 0.73 },
        { year: 1978, month: 1, category: 'edu_junior_high_and_below', ratePercent: 1.41 },
      ])
    );
    expect(points).toHaveLength(5);
  });

  it('skips the yearly summary record (年月別 with no month, e.g. bare "1978")', () => {
    const xml = `<DataCollection><失業率><年月別_Year_and_month>1978</年月別_Year_and_month><總計_Total_百分比>1.67</總計_Total_百分比></失業率></DataCollection>`;
    expect(parseMonthlyUnemploymentRate(xml)).toEqual([]);
  });

  it('skips a field with an empty value instead of writing NaN', () => {
    const xml = `<DataCollection><失業率><年月別_Year_and_month>1978M01</年月別_Year_and_month><總計_Total_百分比></總計_Total_百分比></失業率></DataCollection>`;
    expect(parseMonthlyUnemploymentRate(xml)).toEqual([]);
  });

  it('ignores unrecognized field tags without throwing', () => {
    const xml = `<DataCollection><失業率><年月別_Year_and_month>1978M01</年月別_Year_and_month><總計_Total_百分比>2.01</總計_Total_百分比><某個未知欄位>999</某個未知欄位></失業率></DataCollection>`;
    expect(parseMonthlyUnemploymentRate(xml)).toEqual([{ year: 1978, month: 1, category: 'total', ratePercent: 2.01 }]);
  });

  it('parses multiple records', () => {
    const xml = `<DataCollection>
  <失業率><年月別_Year_and_month>1978M01</年月別_Year_and_month><總計_Total_百分比>2.01</總計_Total_百分比></失業率>
  <失業率><年月別_Year_and_month>1978M02</年月別_Year_and_month><總計_Total_百分比>1.95</總計_Total_百分比></失業率>
</DataCollection>`;
    expect(parseMonthlyUnemploymentRate(xml)).toEqual([
      { year: 1978, month: 1, category: 'total', ratePercent: 2.01 },
      { year: 1978, month: 2, category: 'total', ratePercent: 1.95 },
    ]);
  });

  it('returns an empty array when there are no 失業率 records', () => {
    expect(parseMonthlyUnemploymentRate('<DataCollection></DataCollection>')).toEqual([]);
  });
});
