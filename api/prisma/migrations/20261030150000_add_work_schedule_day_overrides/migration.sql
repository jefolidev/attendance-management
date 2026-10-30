CREATE TABLE "work-schedule-day-override" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_schedule_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    CONSTRAINT "work-schedule-day-override_work_schedule_id_fkey"
      FOREIGN KEY ("work_schedule_id") REFERENCES "work-schedule" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "work-schedule-day-override_work_schedule_id_day_of_week_key"
  ON "work-schedule-day-override"("work_schedule_id", "day_of_week");
