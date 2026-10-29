import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { WORK_SCHEDULE_TIMEZONE } from "@src/core/time/work-schedule-timezone";
import type { TimeBalanceEntryProps } from "@src/domain/manage/enterprise/entities/time-balance-entry";

dayjs.extend(utc);
dayjs.extend(timezone);

export function presentTimeBalanceEntry(entry: TimeBalanceEntryProps) {
  return {
    employeeId: entry.employeeId.toString(),
    timeBalanceId: entry.timeBalanceId.toString(),
    type: entry.type,
    reason: entry.reason,
    durationInMinutes: entry.durationInMinutes,
    createdAt: dayjs(entry.createdAt).tz(WORK_SCHEDULE_TIMEZONE).format(),
  };
}
