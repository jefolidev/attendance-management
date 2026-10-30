import { UniqueEntityId } from "@src/core/entities/unique-entity-id";
import { WorkSchedule as WorkScheduleDomain } from "@src/domain/manage/enterprise/entities/work-schedule";
import type {
    WorkDays,
    WorkSchedule,
} from "../../../../generated/prisma/client.ts";

type PrismaWorkScheduleWithDays = WorkSchedule & {
  workDaysWorkSchedules: Array<{
    workDays: WorkDays;
  }>;
  dayOverrides: Array<{
    dayOfWeek: number;
    startTime: string | null;
    endTime: string | null;
  }>;
};

export class PrismaWorkScheduleMapper {
  static toPrisma(
    schedule: WorkScheduleDomain,
  ): WorkSchedule {
    return {
      id: schedule.id.toString(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      breakStartTime: schedule.breakStartTime ?? null,
      breakEndTime: schedule.breakEndTime ?? null,
      lateTolerance: schedule.lateTolerance,
      breaksPerDay: schedule.breaksPerDay,
      employeeId: schedule.employeeId.toString(),
    };
  }

  static toWorkDaysPrisma(schedule: WorkScheduleDomain): Omit<WorkDays, "id"> {
    return {
      monday: schedule.days.includes(1),
      tuesday: schedule.days.includes(2),
      wednesday: schedule.days.includes(3),
      thursday: schedule.days.includes(4),
      friday: schedule.days.includes(5),
      saturday: schedule.days.includes(6),
      sunday: schedule.days.includes(0),
    };
  }

  static toDomain(raw: PrismaWorkScheduleWithDays): WorkScheduleDomain {
    const workDays = raw.workDaysWorkSchedules?.[0]?.workDays;

    return WorkScheduleDomain.create(
      {
        employeeId: new UniqueEntityId(raw.employeeId),
        startTime: raw.startTime,
        endTime: raw.endTime,
        breakStartTime: raw.breakStartTime,
        breakEndTime: raw.breakEndTime,
        lateTolerance: raw.lateTolerance,
        breaksPerDay: raw.breaksPerDay,
        days: workDays
          ? [
              ...(workDays.sunday ? [0] : []),
              ...(workDays.monday ? [1] : []),
              ...(workDays.tuesday ? [2] : []),
              ...(workDays.wednesday ? [3] : []),
              ...(workDays.thursday ? [4] : []),
              ...(workDays.friday ? [5] : []),
              ...(workDays.saturday ? [6] : []),
            ]
          : [],
        dayOverrides: raw.dayOverrides.map((dayOverride) => ({
          dayOfWeek: dayOverride.dayOfWeek,
          startTime: dayOverride.startTime ?? undefined,
          endTime: dayOverride.endTime ?? undefined,
        })),
      },
      new UniqueEntityId(raw.id),
    );
  }
}
