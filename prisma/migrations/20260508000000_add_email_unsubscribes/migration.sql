-- CreateTable
CREATE TABLE "email_unsubscribes" (
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "unsubscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_unsubscribes_pkey" PRIMARY KEY ("email")
);
