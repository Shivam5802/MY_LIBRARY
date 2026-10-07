-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "entity_type" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "billing_periods" ADD COLUMN     "locker_snapshot" "Locker",
ADD COLUMN     "shift_snapshot" "Shift";

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
