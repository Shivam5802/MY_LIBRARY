-- AlterTable: Add fee_cycle_start_date to students
-- feeCycleStartDate = date from which monthly recurring fee counting starts
ALTER TABLE "students" ADD COLUMN "fee_cycle_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing students: fee_cycle_start_date safely defaults to their existing admission_date
UPDATE "students" SET "fee_cycle_start_date" = "admission_date" WHERE "fee_cycle_start_date" IS NOT NULL;

-- AlterTable: Add due_date to billing_periods
ALTER TABLE "billing_periods" ADD COLUMN "due_date" TIMESTAMP(3);

-- Backfill existing billing periods: due_date for historical cycles safely defaults to period_end
UPDATE "billing_periods" SET "due_date" = "period_end" WHERE "due_date" IS NULL;
