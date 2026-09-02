// 財政部財政資訊中心《全國營業(稅籍)登記資料集》(data.gov.tw/dataset/9400)。每日更新，CSV 直連，
// 涵蓋全國所有登記營業人（不限上市櫃）約171萬列，沒有查詢式 API、沒有篩選參數，只能整份下載
// （約 322MB）再自己過濾。實測驗證過：每個統編可能有多列（總公司+各分公司/廠各自的登記），要鎖定
// 總公司本身的那一列，用「統一編號=自己、總機構統一編號=空白」判斷（詳見
// companyIndustryClassification/service.ts）。
export const FIA_BUSINESS_TAX_REGISTRY_CSV_URL = 'https://eip.fia.gov.tw/data/BGMOPEN1.csv';

// CSV 欄位（表頭原文）：
// 營業地址,統一編號,總機構統一編號,營業人名稱,資本額,設立日期,組織別名稱,使用統一發票,
// 行業代號,名稱,行業代號1,名稱1,行業代號2,名稱2,行業代號3,名稱3
//
// 行業代號/行業代號1/行業代號2/行業代號3 是同一列的四組欄位（主要+最多三個次要），不是四筆不同的
// 登記列——實測驗證過（統編22099131台積電）：主要 261199「其他積體電路製造」、次要1 261111「矽晶圓
// 製造」、次要2 282011「一次電池製造」，三組都在同一列裡。次要欄位常見是空字串（多數小型商號只登記
// 一個行業別），這裡只保留代碼非空的項目。
export interface FiaIndustryCode {
  code: string; // 6碼數字，例如 "233100"
  name: string;
}

export interface FiaBusinessTaxRegistryRow {
  address: string;
  taxId: string;
  headOfficeTaxId: string; // 總機構統一編號，該列若本身就是總公司則為空字串
  businessName: string;
  industryCodes: FiaIndustryCode[]; // 依原始欄位順序：[0]=主要(行業代號)，[1..3]=次要(行業代號1/2/3)，只含代碼非空的項目，至少有一筆（主要）
}

// 手動解析 CSV 一列，不用第三方套件——欄位裡的地址/名稱有時帶引號包住（防止內含逗號），數字/代碼
// 欄位通常不帶引號，這裡同時處理兩種情況。
const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let i = 0;
  const n = line.length;
  while (i <= n) {
    if (line[i] === '"') {
      let j = i + 1;
      let value = '';
      while (j < n) {
        if (line[j] === '"') {
          if (line[j + 1] === '"') {
            value += '"';
            j += 2;
            continue;
          }
          j++;
          break;
        }
        value += line[j];
        j++;
      }
      fields.push(value);
      i = j + 1;
    } else {
      let j = line.indexOf(',', i);
      if (j === -1) j = n;
      fields.push(line.slice(i, j));
      i = j + 1;
    }
  }
  return fields;
};

// 逐列解析，跳過表頭與格式不符的列（例如檔案裡偶爾出現的產生日期戳記列）。回傳 null 代表這一列
// 不是有效的登記資料列（統編或主要行業代號缺漏），呼叫端直接跳過即可。
export const parseFiaBusinessTaxRegistryLine = (line: string): FiaBusinessTaxRegistryRow | null => {
  const fields = parseCsvLine(line);
  if (fields.length < 10) return null;

  const address = fields[0] ?? '';
  const taxId = fields[1] ?? '';
  const headOfficeTaxId = fields[2] ?? '';
  const businessName = fields[3] ?? '';

  const codePairs: Array<[string | undefined, string | undefined]> = [
    [fields[8], fields[9]],
    [fields[10], fields[11]],
    [fields[12], fields[13]],
    [fields[14], fields[15]],
  ];
  if (!/^\d{8}$/.test(taxId) || !codePairs[0]?.[0]) return null;

  const industryCodes: FiaIndustryCode[] = [];
  for (const [code, name] of codePairs) {
    if (code && code.trim() !== '') industryCodes.push({ code, name: name ?? '' });
  }

  return { address, taxId, headOfficeTaxId, businessName, industryCodes };
};
