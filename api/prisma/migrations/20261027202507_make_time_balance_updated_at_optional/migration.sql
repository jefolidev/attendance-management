-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_time_balances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "balance_minutes" INTEGER NOT NULL,
    "updated_at" DATETIME,
    "employee_id" TEXT NOT NULL,
    CONSTRAINT "time_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_time_balances" ("balance_minutes", "employee_id", "id", "updated_at") SELECT "balance_minutes", "employee_id", "id", "updated_at" FROM "time_balances";
DROP TABLE "time_balances";
ALTER TABLE "new_time_balances" RENAME TO "time_balances";
CREATE UNIQUE INDEX "time_balances_employee_id_key" ON "time_balances"("employee_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
