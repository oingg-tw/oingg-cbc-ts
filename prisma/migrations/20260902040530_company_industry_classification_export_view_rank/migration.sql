-- export.company_industry_classification 原本假設一家公司只有一列，改成 1:多之後同一 stock_code
-- 會出現最多 4 列（主要+次要1/2/3），這裡加上 rank 欄位讓 analysis-ts 能自己決定要不要只取主要
-- （WHERE rank = 0）還是連次要行業別一起用。
--
-- 原本想用 CREATE OR REPLACE VIEW 直接插入 rank 到 tax_id 後面，結果 Postgres 拒絕：
-- "cannot change name of view column industry_code to rank" ——CREATE OR REPLACE VIEW 只能在最後面
-- 加欄位，不能插進中間（會讓後面所有欄位的欄位位置往後移一格，等於改名）。這裡改成先 DROP 再
-- CREATE：這個 view 沒有其他 view/function 依賴它，DROP 是安全的；etl_reader 的權限來自
-- ALTER DEFAULT PRIVILEGES（對 schema 生效，不是對個別 view 一次性授權），重建後自動涵蓋，不需要
-- 重新 GRANT。
DROP VIEW "export"."company_industry_classification";

CREATE VIEW "export"."company_industry_classification" AS
SELECT
  cp.stock_code,
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
