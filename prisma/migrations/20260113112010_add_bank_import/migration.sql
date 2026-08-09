-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "bank_transaction_data" JSONB;

-- CreateTable
CREATE TABLE "bank_imports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "recurring_detected" INTEGER NOT NULL,
    "subscriptions_created" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_aliases" (
    "id" TEXT NOT NULL,
    "bank_pattern" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,

    CONSTRAINT "merchant_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_imports_user_id_idx" ON "bank_imports"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_aliases_bank_pattern_key" ON "merchant_aliases"("bank_pattern");

-- AddForeignKey
ALTER TABLE "bank_imports" ADD CONSTRAINT "bank_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
