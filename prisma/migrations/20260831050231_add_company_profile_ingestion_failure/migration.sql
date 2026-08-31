-- CreateTable
CREATE TABLE "company_profile_ingestion_failures" (
    "tax_id" TEXT NOT NULL,
    "stock_code" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profile_ingestion_failures_pkey" PRIMARY KEY ("tax_id")
);
