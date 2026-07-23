-- CreateTable
CREATE TABLE "pending_merchant_aliases" (
    "id" TEXT NOT NULL,
    "bank_pattern" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "sample_description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "pending_merchant_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_merchant_aliases_bank_pattern_key" ON "pending_merchant_aliases"("bank_pattern");

-- CreateIndex
CREATE INDEX "pending_merchant_aliases_status_idx" ON "pending_merchant_aliases"("status");
