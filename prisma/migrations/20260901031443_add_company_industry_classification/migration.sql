-- CreateTable
CREATE TABLE "public"."company_industry_classifications" (
    "tax_id" TEXT NOT NULL,
    "industry_code" TEXT NOT NULL,
    "source_industry_name" TEXT NOT NULL,
    "registered_address" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_industry_classifications_pkey" PRIMARY KEY ("tax_id")
);

-- CreateIndex
CREATE INDEX "company_industry_classifications_industry_code_idx" ON "public"."company_industry_classifications"("industry_code");

-- AddForeignKey
ALTER TABLE "public"."company_industry_classifications" ADD CONSTRAINT "company_industry_classifications_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "public"."company_profiles"("tax_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_industry_classifications" ADD CONSTRAINT "company_industry_classifications_industry_code_fkey" FOREIGN KEY ("industry_code") REFERENCES "public"."tax_industry_classification"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
