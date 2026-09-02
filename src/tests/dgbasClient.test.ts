import { describe, it, expect } from 'vitest';
import { parseDgbasObsXml } from '@/adapters/dgbas/client';

describe('parseDgbasObsXml', () => {
  it('parses a well-formed Obs block, including the newline that appears before Item_VALUE in real files', () => {
    // 實測驗證過（CPI/GDP 真實檔案）：<TYPE>...</TYPE> 跟 <Item_VALUE> 之間偶爾有換行，其他標籤之間
    // 沒有——這裡故意保留這個不對稱的格式，確認 regex 的 \s* 真的能撐過去。
    const xml = `<?xml version="1.0" encoding="utf-8" ?>
<DataSet Sender_NAME="行政院主計總處" Tab_NAME="消費者物價基本分類指數">
<Obs><Item>總指數(指數基期：民國110年=100)</Item><TIME_PERIOD>1981M01</TIME_PERIOD><FREQ>M</FREQ><TYPE>原始值</TYPE>
<Item_VALUE>52.95</Item_VALUE></Obs>
</DataSet>`;
    expect(parseDgbasObsXml(xml)).toEqual([{ item: '總指數(指數基期：民國110年=100)', timePeriod: '1981M01', freq: 'M', type: '原始值', value: '52.95' }]);
  });

  it('parses an empty Item_VALUE (DGBAS missing-value marker) as an empty string, not undefined', () => {
    const xml = '<Obs><Item>總指數</Item><TIME_PERIOD>1981M01</TIME_PERIOD><FREQ>M</FREQ><TYPE>年增率(%)</TYPE><Item_VALUE></Item_VALUE></Obs>';
    expect(parseDgbasObsXml(xml)).toEqual([{ item: '總指數', timePeriod: '1981M01', freq: 'M', type: '年增率(%)', value: '' }]);
  });

  it('parses multiple Obs blocks in document order', () => {
    const xml =
      '<Obs><Item>A</Item><TIME_PERIOD>1981M01</TIME_PERIOD><FREQ>M</FREQ><TYPE>原始值</TYPE><Item_VALUE>1</Item_VALUE></Obs>' +
      '<Obs><Item>B</Item><TIME_PERIOD>1981M02</TIME_PERIOD><FREQ>M</FREQ><TYPE>原始值</TYPE><Item_VALUE>2</Item_VALUE></Obs>';
    const results = parseDgbasObsXml(xml);
    expect(results.map((r) => r.item)).toEqual(['A', 'B']);
  });

  it('parses quarterly periods (GDP uses FREQ=Q, TIME_PERIOD like 1981Q1)', () => {
    const xml = '<Obs><Item>經濟成長率(百分點)</Item><TIME_PERIOD>1981Q1</TIME_PERIOD><FREQ>Q</FREQ><TYPE>原始值</TYPE><Item_VALUE>7.19</Item_VALUE></Obs>';
    expect(parseDgbasObsXml(xml)[0]).toMatchObject({ timePeriod: '1981Q1', freq: 'Q' });
  });

  it('returns an empty array when there are no Obs blocks', () => {
    expect(parseDgbasObsXml('<DataSet></DataSet>')).toEqual([]);
  });
});
