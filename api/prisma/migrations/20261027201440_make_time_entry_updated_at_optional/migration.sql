-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clock_in" DATETIME NOT NULL,
    "clock_out" DATETIME,
    "breaks" JSONB NOT NULL,
    "updated_at" DATETIME,
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "TimeEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TimeEntry" ("breaks", "clock_in", "clock_out", "employeeId", "id", "updated_at") SELECT "breaks", "clock_in", "clock_out", "employeeId", "id", "updated_at" FROM "TimeEntry";
DROP TABLE "TimeEntry";
ALTER TABLE "new_TimeEntry" RENAME TO "TimeEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
