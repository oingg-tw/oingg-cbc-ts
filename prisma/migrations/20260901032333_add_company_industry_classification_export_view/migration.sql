-- CreateView
-- analysis-ts 的 export 契約層新增一份視圖：company_industry_classification（每家已追蹤公司的官方
-- 行業分類，見 companyIndustryClassification domain 的說明）。etl_reader 對 export schema 已有
-- ALTER DEFAULT PRIVILEGES 授權（見另外執行的 CREATE ROLE 腳本），這個新視圖建立後會自動被涵蓋，
-- 不需要重新 GRANT。
CREATE VIEW "export"."company_industry_classification" AS
SELECT
  cp.stock_code,
  cp.tax_id,
  cic.industry_code,
  cic.source_industry_name,
  tic.section_code,
  tic.division_code,
  tic.group_code,
  tic.class_code,
  tic.subclass_code,
  tic.name_zh AS classification_name_zh,
  cic.updated_at
FROM "public"."company_industry_classifications" cic
JOIN "public"."company_profiles" cp ON cp.tax_id = cic.tax_id
JOIN "public"."tax_industry_classification" tic ON tic.code = cic.industry_code;
