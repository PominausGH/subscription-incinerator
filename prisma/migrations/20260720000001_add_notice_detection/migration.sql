-- AlterTable
ALTER TABLE "pending_subscriptions" ADD COLUMN     "source_type" TEXT NOT NULL DEFAULT 'receipt',
ADD COLUMN     "notice_type" TEXT;
