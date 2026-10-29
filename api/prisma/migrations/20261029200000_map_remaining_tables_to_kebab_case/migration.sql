PRAGMA foreign_keys=OFF;

DROP INDEX IF EXISTS "WorkSchedule_employeeId_key";

ALTER TABLE "TimeEntry" RENAME TO "time-entry";
ALTER TABLE "WorkDays" RENAME TO "work-days";
ALTER TABLE "WorkDaysWorkSchedule" RENAME TO "work-days-work-schedule";
ALTER TABLE "WorkSchedule" RENAME TO "work-schedule";

CREATE UNIQUE INDEX "work-schedule_employeeId_key" ON "work-schedule"("employeeId");

PRAGMA foreign_keys=ON;
