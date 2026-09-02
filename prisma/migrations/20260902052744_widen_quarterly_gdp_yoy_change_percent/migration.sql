-- AlterTable
-- 實測發現真實資料裡「國外淨需求-小計」1986Q1 的年增率是 24300（基期接近零時年增率會爆量，不是
-- 資料錯誤，見 schema.prisma 的 QuarterlyGdp.yoyChangePercent 註解），原本的 DECIMAL(8,4) 裝不下。
-- export.quarterly_gdp 這個 view 有引用到這個欄位，Postgres 不允許直接改型別，要先砍掉 view、
-- 改完型別再重建（CREATE VIEW 內容跟原本一樣，不是新視圖，etl_reader 的權限不受影響）。
DROP VIEW "export"."quarterly_gdp";

ALTER TABLE "quarterly_gdp" ALTER COLUMN "yoy_change_percent" SET DATA TYPE DECIMAL(14,4);

CREATE VIEW "export"."quarterly_gdp" AS
SELECT "year", "quarter", "category", "contribution_points", "yoy_change_percent", "updated_at"
FROM "public"."quarterly_gdp";
