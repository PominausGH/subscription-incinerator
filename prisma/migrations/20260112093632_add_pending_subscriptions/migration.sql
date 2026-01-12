-- CreateTable
CREATE TABLE "pending_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_trial" BOOLEAN NOT NULL DEFAULT false,
    "trial_ends_at" TIMESTAMP(3),
    "next_billing_date" TIMESTAMP(3),
    "email_id" TEXT NOT NULL,
    "email_subject" TEXT NOT NULL,
    "email_from" TEXT NOT NULL,
    "email_date" TIMESTAMP(3) NOT NULL,
    "raw_email_data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_subscriptions_user_id_status_idx" ON "pending_subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "pending_subscriptions_expires_at_idx" ON "pending_subscriptions"("expires_at");

-- AddForeignKey
ALTER TABLE "pending_subscriptions" ADD CONSTRAINT "pending_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
