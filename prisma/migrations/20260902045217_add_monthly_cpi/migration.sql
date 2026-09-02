-- CreateTable
CREATE TABLE "monthly_cpi" (
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "index_value" DECIMAL(10,4),
    "yoy_change_percent" DECIMAL(8,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_cpi_pkey" PRIMARY KEY ("year","month","category")
);
