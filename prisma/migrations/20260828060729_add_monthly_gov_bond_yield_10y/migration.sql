-- CreateTable
CREATE TABLE "monthly_gov_bond_yield_10y" (
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "yield_rate" DECIMAL(8,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_gov_bond_yield_10y_pkey" PRIMARY KEY ("year","month")
);
