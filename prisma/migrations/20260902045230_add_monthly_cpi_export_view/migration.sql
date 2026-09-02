-- CreateView
-- analysis-ts 的 export 契約層新增 monthly_cpi：消費者物價基本分類指數月資料（總指數+七大類，見
-- monthlyCpi/types.ts 的 CpiCategory 說明）。etl_reader 對 export schema 已有
-- ALTER DEFAULT PRIVILEGES 授權，這個新視圖建立後會自動被涵蓋，不需要重新 GRANT。
CREATE VIEW "export"."monthly_cpi" AS
SELECT "year", "month", "category", "index_value", "yoy_change_percent", "updated_at"
FROM "public"."monthly_cpi";
