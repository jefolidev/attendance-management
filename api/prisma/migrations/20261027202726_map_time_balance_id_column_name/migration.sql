/*
  Warnings:

  - You are about to drop the column `timeBalanceId` on the `time_balance_entries` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_time_balance_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration_in_minutes" INTEGER NOT NULL,
    "employee_id" TEXT NOT NULL,
    "time_balance_id" TEXT,
    CONSTRAINT "time_balance_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "time_balance_entries_time_balance_id_fkey" FOREIGN KEY ("time_balance_id") REFERENCES "time_balances" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_time_balance_entries" ("duration_in_minutes", "employee_id", "id", "reason", "type") SELECT "duration_in_minutes", "employee_id", "id", "reason", "type" FROM "time_balance_entries";
DROP TABLE "time_balance_entries";
ALTER TABLE "new_time_balance_entries" RENAME TO "time_balance_entries";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
