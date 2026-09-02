-- CreateView
-- analysis-ts 的 export 契約層新增三個總經 view，對應這次一起建的 quarterly_gdp/
-- monthly_unemployment_rate/monthly_business_cycle_indicator 三張表。etl_reader 對 export schema
-- 已有 ALTER DEFAULT PRIVILEGES 授權，這幾個新視圖建立後會自動被涵蓋，不需要重新 GRANT。
CREATE VIEW "export"."quarterly_gdp" AS
SELECT "year", "quarter", "category", "contribution_points", "yoy_change_percent", "updated_at"
FROM "public"."quarterly_gdp";

CREATE VIEW "export"."monthly_unemployment_rate" AS
SELECT "year", "month", "category", "rate_percent", "updated_at"
FROM "public"."monthly_unemployment_rate";

CREATE VIEW "export"."monthly_business_cycle_indicator" AS
SELECT
  "year", "month",
  "leading_index_composite", "leading_index_detrended",
  "coincident_index_composite", "coincident_index_detrended",
  "lagging_index_composite", "lagging_index_detrended",
  "signal_score", "signal_light",
  "updated_at"
FROM "public"."monthly_business_cycle_indicator";
