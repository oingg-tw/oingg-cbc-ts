import prisma from '@/adapters/prisma/index';
import type { TaxIndustryClassification } from '@prisma/client';

export interface ListTaxIndustryClassificationFilter {
  level?: string;
  sectionCode?: string;
  divisionCode?: string;
  groupCode?: string;
  classCode?: string;
}

// 純讀取靜態參考資料，不涉及 CBC/GCIS 之類外部 API，直接查 DB。level/sectionCode/.../classCode
// 都是可選的 AND 條件；全部省略時回傳整張表（2,466 列，屬於參考資料，不分頁）。
export const listTaxIndustryClassification = (filter: ListTaxIndustryClassificationFilter): Promise<TaxIndustryClassification[]> => {
  return prisma.taxIndustryClassification.findMany({
    where: {
      level: filter.level,
      sectionCode: filter.sectionCode,
      divisionCode: filter.divisionCode,
      groupCode: filter.groupCode,
      classCode: filter.classCode,
    },
    orderBy: { code: 'asc' },
  });
};

export const getTaxIndustryClassificationByCode = (code: string): Promise<TaxIndustryClassification | null> => {
  return prisma.taxIndustryClassification.findUnique({ where: { code } });
};
