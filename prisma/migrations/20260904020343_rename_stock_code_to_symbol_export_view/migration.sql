-- 跨服務命名對齊（conductor 的 ubiquitous-language-glossary.md）：twse-ts/tpex-ts/mops-ts/
-- analysis-ts 對「證券代碼」這個概念都叫 symbol，只有 gov-ts 的 export view 沿用內部欄位名
-- stock_code。這裡只改 export 這一層的輸出欄位名，不動內部 public.company_profiles.stock_code
-- 欄位本身或 Prisma schema——內部命名是這個服務自己的事，export 才是跨服務契約，只有契約這一層
-- 需要跟其他服務對齊。
--
-- Postgres 的 CREATE OR REPLACE VIEW 不允許重新命名既有輸出欄位（只能在最後面加欄位），所以一樣
-- 用 DROP 再 CREATE（跟先前加 rank 欄位時同一個限制，見同一份 migration 歷史裡的說明）。這個 view
-- 沒有其他 view/function 依賴它，DROP 是安全的；etl_reader 的權限來自 ALTER DEFAULT PRIVILEGES，
-- 重建後自動涵蓋，不需要重新 GRANT。
DROP VIEW "export"."company_industry_classification";

CREATE VIEW "export"."company_industry_classification" AS
SELECT
  cp.stock_code AS symbol,
  cp.tax_id,
  cic.rank,
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
