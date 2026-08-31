-- AddColumn (nullable first, backfilled below, then set NOT NULL)
ALTER TABLE "company_business_items" ADD COLUMN "position" INTEGER;

-- Backfill: use insertion order (id) within each tax_id as a stand-in for the original
-- GCIS array order, since seq_no itself isn't reliable (that's exactly why this column exists).
UPDATE "company_business_items" AS t
SET "position" = sub.rn - 1
FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "tax_id" ORDER BY "id") AS rn
    FROM "company_business_items"
) AS sub
WHERE t."id" = sub."id";

ALTER TABLE "company_business_items" ALTER COLUMN "position" SET NOT NULL;

-- DropIndex
DROP INDEX "company_business_items_tax_id_seq_no_key";

-- CreateIndex
CREATE UNIQUE INDEX "company_business_items_tax_id_position_key" ON "company_business_items"("tax_id", "position");
