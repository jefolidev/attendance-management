import type { WorkSchedule } from "@src/domain/manage/enterprise/entities/work-schedule";

export function presentWorkSchedule(workSchedule: WorkSchedule) {
  return {
    id: workSchedule.id.toString(),
    employeeId: workSchedule.employeeId.toString(),
    startTime: workSchedule.startTime,
    endTime: workSchedule.endTime,
    breakStartTime: workSchedule.breakStartTime,
    breakEndTime: workSchedule.breakEndTime,
    lateTolerance: workSchedule.lateTolerance,
    breaksPerDay: workSchedule.breaksPerDay,
    days: workSchedule.days,
    dayOverrides: workSchedule.dayOverrides,
  };
}
