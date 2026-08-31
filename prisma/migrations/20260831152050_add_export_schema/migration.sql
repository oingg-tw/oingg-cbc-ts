-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "export";

-- CreateTable
CREATE TABLE "export"."ingestion_runs" (
    "run_id" BIGSERIAL NOT NULL,
    "dataset" TEXT NOT NULL,
    "data_date" DATE NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("run_id")
);

-- CreateIndex
CREATE INDEX "ingestion_runs_dataset_status_idx" ON "export"."ingestion_runs"("dataset", "status");

-- CreateView
-- analysis-ts 的 export 契約層：只讀視圖，欄位形狀是我方自己決定的（不是內部表欄位的直接曝露），
-- 定案後只能加欄位不能刪。etl_reader 只被授權 SELECT 這個 schema，看不到 public schema 底下的
-- 任何內部表（grants 見另外執行的 CREATE ROLE 腳本，密碼不進 migration 歷史，不在這個檔案裡）。
CREATE VIEW "export"."monthly_gov_bond_yield_10y" AS
SELECT "year", "month", "yield_rate", "updated_at"
FROM "public"."monthly_gov_bond_yield_10y";
