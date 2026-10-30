-- Add optional schedule break times without changing existing schedules.
ALTER TABLE "work-schedule" ADD COLUMN "break_start_time" TEXT;
ALTER TABLE "work-schedule" ADD COLUMN "break_end_time" TEXT;
