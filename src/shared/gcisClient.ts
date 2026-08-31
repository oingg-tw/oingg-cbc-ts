// 經濟部商工行政資料開放平台「公司登記基本資料及營業項目」API 的共用 GET client。用統一編號
// （Business_Accounting_NO）查詢，回傳陣列（因為底層是 $filter 查詢，理論上可能查到 0 或 1 筆——
// 統編本身唯一，正常情況下不會超過 1 筆）。這個端點不需要 API key。
const GCIS_COMPANY_BUSINESS_API_URL = 'https://data.gcis.nat.gov.tw/od/data/api/236EE382-4942-41A9-BD03-CA0709025E7C';

// Cmp_Business 陣列裡的每一列不一定是代碼化的營業項目——Business_Item 可能是空白（只有空格），
// 這種列是「所營事業資料」的自由文字說明（例如「依客戶之訂單...」），不是代碼表能查到的項目，
// 原樣照登，不特別處理。
export interface GcisCompanyBusinessItem {
  Business_Seq_NO: string;
  Business_Item: string;
  Business_Item_Desc: string;
}

export interface GcisCompanyRecord {
  Business_Accounting_NO: string;
  Company_Name: string;
  Company_Status: string;
  Company_Status_Desc: string;
  Company_Setup_Date: string;
  Cmp_Business: GcisCompanyBusinessItem[];
}

export const fetchCompanyBusinessItems = async (businessAccountingNo: string): Promise<GcisCompanyRecord[]> => {
  const filter = `Business_Accounting_NO eq '${businessAccountingNo}'`;
  const url = `${GCIS_COMPANY_BUSINESS_API_URL}?${new URLSearchParams({ $format: 'json', $filter: filter }).toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GCIS API 回應非 200：${response.status}（統編=${businessAccountingNo}）`);
  }

  // 查無此統編時，GCIS 回傳 HTTP 200 但 body 是空字串（不是 "[]"），直接 .json() 會丟
  // "Unexpected end of JSON input"——空字串視同查無資料，回傳空陣列。
  const text = await response.text();
  if (text.trim() === '') return [];
  return JSON.parse(text) as GcisCompanyRecord[];
};
