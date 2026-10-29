import { WORK_SCHEDULE_TIMEZONE } from "@src/core/time/work-schedule-timezone";
import type { EntriesAndStatisticsProps } from "@src/domain/manage/application/use-cases/value-objects/entries-and-statistics";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export function presentEntriesAndStatistics(
  entry: EntriesAndStatisticsProps,
) {
  return {
    timeEntryStage: entry.timeEntryStage,
    occurredAt: dayjs(entry.occurredAt).tz(WORK_SCHEDULE_TIMEZONE).format(),
    breaks: entry.breaks.map((breakEntry) => ({
      start: dayjs(breakEntry.start).tz(WORK_SCHEDULE_TIMEZONE).format(),
      end: breakEntry.end
        ? dayjs(breakEntry.end).tz(WORK_SCHEDULE_TIMEZONE).format()
        : null,
    })),
    entryMinutesEarly: entry.entryMinutesEarly,
    entryMinutesLate: entry.entryMinutesLate,
    departureMinutesEarly: entry.departureMinutesEarly,
    departureMinutesLate: entry.departureMinutesLate,
    totalWorkedMinutes: entry.totalWorkedMinutes,
  };
}

export function presentEntriesAndStatisticsList(
  entries: Record<string, EntriesAndStatisticsProps>[],
) {
  return entries.map((entry) => {
    const [date, statistics] = Object.entries(entry)[0]!;

    return {
      [date]: presentEntriesAndStatistics(statistics),
    };
  });
}
