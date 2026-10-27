/*
  Warnings:

  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `breakEnd` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `breakStart` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `clockIn` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `clockOut` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `WorkSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `WorkSchedule` table. All the data in the column will be lost.
  - Added the required column `breaks` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clock_in` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `breaks_per_day` to the `WorkSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `WorkSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `late_tolerance` to the `WorkSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `WorkSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Employee";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "time_balance_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration_in_minutes" INTEGER NOT NULL,
    "employee_id" TEXT NOT NULL,
    "timeBalanceId" TEXT,
    CONSTRAINT "time_balance_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "time_balance_entries_timeBalanceId_fkey" FOREIGN KEY ("timeBalanceId") REFERENCES "time_balances" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "time_balances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "balance_minutes" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "employee_id" TEXT NOT NULL,
    CONSTRAINT "time_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkDays" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monday" BOOLEAN NOT NULL,
    "tuesday" BOOLEAN NOT NULL,
    "wednesday" BOOLEAN NOT NULL,
    "thursday" BOOLEAN NOT NULL,
    "friday" BOOLEAN NOT NULL,
    "saturday" BOOLEAN NOT NULL,
    "sunday" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "WorkDaysWorkSchedule" (
    "work_days_id" INTEGER NOT NULL,
    "work_schedule_id" TEXT NOT NULL,

    PRIMARY KEY ("work_days_id", "work_schedule_id"),
    CONSTRAINT "WorkDaysWorkSchedule_work_days_id_fkey" FOREIGN KEY ("work_days_id") REFERENCES "WorkDays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkDaysWorkSchedule_work_schedule_id_fkey" FOREIGN KEY ("work_schedule_id") REFERENCES "WorkSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clock_in" DATETIME NOT NULL,
    "clock_out" DATETIME,
    "breaks" JSONB NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "TimeEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TimeEntry" ("employeeId", "id") SELECT "employeeId", "id" FROM "TimeEntry";
DROP TABLE "TimeEntry";
ALTER TABLE "new_TimeEntry" RENAME TO "TimeEntry";
CREATE TABLE "new_WorkSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "late_tolerance" INTEGER NOT NULL,
    "breaks_per_day" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "WorkSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkSchedule" ("employeeId", "id") SELECT "employeeId", "id" FROM "WorkSchedule";
DROP TABLE "WorkSchedule";
ALTER TABLE "new_WorkSchedule" RENAME TO "WorkSchedule";
CREATE UNIQUE INDEX "WorkSchedule_employeeId_key" ON "WorkSchedule"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "time_balances_employee_id_key" ON "time_balances"("employee_id");
