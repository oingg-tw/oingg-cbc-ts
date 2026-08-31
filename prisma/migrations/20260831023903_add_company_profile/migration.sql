-- CreateTable
CREATE TABLE "company_profiles" (
    "tax_id" TEXT NOT NULL,
    "stock_code" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_status" TEXT NOT NULL,
    "company_status_desc" TEXT NOT NULL,
    "company_setup_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("tax_id")
);

-- CreateTable
CREATE TABLE "company_business_items" (
    "id" SERIAL NOT NULL,
    "tax_id" TEXT NOT NULL,
    "seq_no" TEXT NOT NULL,
    "item_code" TEXT,
    "item_desc" TEXT NOT NULL,

    CONSTRAINT "company_business_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_stock_code_key" ON "company_profiles"("stock_code");

-- CreateIndex
CREATE INDEX "company_business_items_item_code_idx" ON "company_business_items"("item_code");

-- CreateIndex
CREATE UNIQUE INDEX "company_business_items_tax_id_seq_no_key" ON "company_business_items"("tax_id", "seq_no");

-- AddForeignKey
ALTER TABLE "company_business_items" ADD CONSTRAINT "company_business_items_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "company_profiles"("tax_id") ON DELETE CASCADE ON UPDATE CASCADE;
