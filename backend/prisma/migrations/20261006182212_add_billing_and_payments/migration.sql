-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'OTHER');

-- CreateTable
CREATE TABLE "billing_periods" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "billing_period_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "student_id" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "billing_periods_student_id_period_start_period_end_idx" ON "billing_periods"("student_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "billing_periods_student_id_period_start_key" ON "billing_periods"("student_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");

-- CreateIndex
CREATE INDEX "payments_student_id_idx" ON "payments"("student_id");

-- CreateIndex
CREATE INDEX "payments_billing_period_id_idx" ON "payments"("billing_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_student_id_idx" ON "activity_logs"("student_id");

-- AddForeignKey
ALTER TABLE "billing_periods" ADD CONSTRAINT "billing_periods_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billing_period_id_fkey" FOREIGN KEY ("billing_period_id") REFERENCES "billing_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
