-- 把 company_industry_classifications 從「一家公司一列」改成「一家公司最多四列」（主要+次要1/2/3
-- 行業代號各一列，見 companyIndustryClassification/service.ts 與 schema.prisma 的說明）。
--
-- 手動寫這份 migration 而不是用 `prisma migrate dev` 自動產生，是因為 PK 從 tax_id 換成新的 id 欄位、
-- 且要新增一個 NOT NULL 的 rank 欄位，Prisma 在非互動環境下無法自動判斷「現有 999 筆資料的 rank 該
-- 填什麼」而拒絕產生 migration（見指令輸出：'Added the required column `rank`... it is not possible
-- to execute this step'）。這裡手動處理：既有資料在這次改動之前全部都只存主要行業代號，所以用
-- DEFAULT 0 回填完全正確（rank=0 就是「主要」的定義），不是隨便挑的安全值。

-- Step 1：新增 id（未來的 PK）與 rank（先給預設值 0 回填既有 999 筆）
ALTER TABLE "company_industry_classifications" ADD COLUMN "id" SERIAL;
ALTER TABLE "company_industry_classifications" ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 0;

-- Step 2：既有資料回填完成，之後的寫入一律由程式明確帶 rank，不需要 DB 端預設值
ALTER TABLE "company_industry_classifications" ALTER COLUMN "rank" DROP DEFAULT;

-- Step 3：PK 從 tax_id 換成 id
ALTER TABLE "company_industry_classifications" DROP CONSTRAINT "company_industry_classifications_pkey";
ALTER TABLE "company_industry_classifications" ADD CONSTRAINT "company_industry_classifications_pkey" PRIMARY KEY ("id");

-- Step 4：(tax_id, rank) 換成唯一約束（取代原本 tax_id 自己是 PK 隱含的唯一性）
ALTER TABLE "company_industry_classifications" ADD CONSTRAINT "company_industry_classifications_tax_id_rank_key" UNIQUE ("tax_id", "rank");
