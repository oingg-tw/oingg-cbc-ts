-- CreateView
-- analysis-ts 的 export 契約層新增 industry_codes：完整的稅務行業標準分類字典（大/中/小/細/子類
-- 五層階層），讓 analysis-ts 能直接把 company_industry_classification 裡的 section_code/
-- division_code/group_code/class_code/subclass_code 解析成人類可讀的名稱，不用回頭查我們的
-- 內部表。etl_reader 對 export schema 已有 ALTER DEFAULT PRIVILEGES 授權，這個新視圖建立後
-- 會自動被涵蓋，不需要重新 GRANT（跟先前兩個 export view 一樣）。
CREATE VIEW "export"."industry_codes" AS
SELECT
  "code",
  "level",
  "section_code",
  "division_code",
  "group_code",
  "class_code",
  "subclass_code",
  "name_zh",
  "name_en",
  "updated_at"
FROM "public"."tax_industry_classification";
