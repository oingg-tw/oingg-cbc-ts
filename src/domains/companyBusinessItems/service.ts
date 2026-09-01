import { fetchCompanyBusinessItems, type GcisCompanyRecord } from '@/adapters/gcis';

export interface GetCompanyBusinessItemsResult {
  success: boolean;
  records: GcisCompanyRecord[];
  error?: string;
}

export const getCompanyBusinessItems = async (businessAccountingNo: string): Promise<GetCompanyBusinessItemsResult> => {
  try {
    const records = await fetchCompanyBusinessItems(businessAccountingNo);
    return { success: true, records };
  } catch (error) {
    return { success: false, records: [], error: error instanceof Error ? error.message : String(error) };
  }
};
