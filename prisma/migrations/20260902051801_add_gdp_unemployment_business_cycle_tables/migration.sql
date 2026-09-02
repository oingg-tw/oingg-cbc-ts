-- CreateTable
CREATE TABLE "quarterly_gdp" (
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "contribution_points" DECIMAL(10,4),
    "yoy_change_percent" DECIMAL(8,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quarterly_gdp_pkey" PRIMARY KEY ("year","quarter","category")
);

-- CreateTable
CREATE TABLE "monthly_unemployment_rate" (
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "rate_percent" DECIMAL(8,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_unemployment_rate_pkey" PRIMARY KEY ("year","month","category")
);

-- CreateTable
CREATE TABLE "monthly_business_cycle_indicator" (
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "leading_index_composite" DECIMAL(10,4),
    "leading_index_detrended" DECIMAL(10,4),
    "coincident_index_composite" DECIMAL(10,4),
    "coincident_index_detrended" DECIMAL(10,4),
    "lagging_index_composite" DECIMAL(10,4),
    "lagging_index_detrended" DECIMAL(10,4),
    "signal_score" DECIMAL(6,2),
    "signal_light" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_business_cycle_indicator_pkey" PRIMARY KEY ("year","month")
);
