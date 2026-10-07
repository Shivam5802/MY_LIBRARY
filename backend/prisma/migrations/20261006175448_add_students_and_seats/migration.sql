-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'EVENING', 'FULL_DAY');

-- CreateEnum
CREATE TYPE "Locker" AS ENUM ('WITH_LOCKER', 'WITHOUT_LOCKER');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'OCCUPIED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "profile_photo_url" TEXT;

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "photo_url" TEXT,
    "shift" "Shift" NOT NULL,
    "locker" "Locker" NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL,
    "monthly_fee" DECIMAL(10,2) NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_seat_assignments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "seat_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacated_at" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "student_seat_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seats_seat_number_key" ON "seats"("seat_number");

-- CreateIndex
CREATE INDEX "student_seat_assignments_student_id_is_current_idx" ON "student_seat_assignments"("student_id", "is_current");

-- CreateIndex
CREATE INDEX "student_seat_assignments_seat_id_is_current_idx" ON "student_seat_assignments"("seat_id", "is_current");

-- AddForeignKey
ALTER TABLE "student_seat_assignments" ADD CONSTRAINT "student_seat_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_seat_assignments" ADD CONSTRAINT "student_seat_assignments_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
