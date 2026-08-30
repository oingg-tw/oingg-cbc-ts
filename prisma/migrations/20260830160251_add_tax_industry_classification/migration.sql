-- CreateTable
CREATE TABLE "tax_industry_classification" (
    "code" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "section_code" TEXT,
    "division_code" TEXT,
    "group_code" TEXT,
    "class_code" TEXT,
    "subclass_code" TEXT,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT,
    "definition" TEXT,
    "exclusions" TEXT,
    "prior_revision_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_industry_classification_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "tax_industry_classification_section_code_idx" ON "tax_industry_classification"("section_code");

-- CreateIndex
CREATE INDEX "tax_industry_classification_division_code_idx" ON "tax_industry_classification"("division_code");

-- CreateIndex
CREATE INDEX "tax_industry_classification_group_code_idx" ON "tax_industry_classification"("group_code");

-- CreateIndex
CREATE INDEX "tax_industry_classification_class_code_idx" ON "tax_industry_classification"("class_code");
