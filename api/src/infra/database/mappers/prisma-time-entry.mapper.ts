import { UniqueEntityId } from "@src/core/entities/unique-entity-id";
import {
    TimeEntryStage as DomainTimeEntryStage,
    TimeEntry as TimeEntryDomain,
} from "@src/domain/manage/enterprise/entities/time-entry";
import {
    TimeEntryStage as PrismaTimeEntryStage,
    type TimeEntry,
} from "../../../../generated/prisma/client.ts";

const statusToPrisma: Record<
  DomainTimeEntryStage,
  PrismaTimeEntryStage
> = {
  [DomainTimeEntryStage.CLOCKED_IN]: PrismaTimeEntryStage.CLOCKED_IN,
  [DomainTimeEntryStage.CLOCKED_OUT]: PrismaTimeEntryStage.CLOCKED_OUT,
  [DomainTimeEntryStage.ON_BREAK]: PrismaTimeEntryStage.ON_BREAK,
};

const statusToDomain: Record<
  PrismaTimeEntryStage,
  DomainTimeEntryStage
> = {
  [PrismaTimeEntryStage.CLOCKED_IN]: DomainTimeEntryStage.CLOCKED_IN,
  [PrismaTimeEntryStage.CLOCKED_OUT]: DomainTimeEntryStage.CLOCKED_OUT,
  [PrismaTimeEntryStage.ON_BREAK]: DomainTimeEntryStage.ON_BREAK,
};

export class PrismaTimeEntryMapper {
  static toPrisma(timeEntry: TimeEntryDomain): TimeEntry {
    return {
      id: timeEntry.id.toString(),
      employeeId: timeEntry.employeeId.toString(),
      clockIn: timeEntry.clockIn,
      clockOut: timeEntry.clockOut ?? null,
      status: statusToPrisma[timeEntry.status],
      breaks: JSON.parse(JSON.stringify(timeEntry.breaks)),
      updatedAt: timeEntry.updatedAt || null,
    };
  }

  static toDomain(raw: TimeEntry): TimeEntryDomain {
    return TimeEntryDomain.create({
      employeeId: new UniqueEntityId(raw.employeeId),
      clockIn: raw.clockIn,
      clockOut: raw.clockOut || undefined,
      breaks: JSON.parse(JSON.stringify(raw.breaks)),
      status: statusToDomain[raw.status],
      updatedAt: raw.updatedAt,
    }, new UniqueEntityId(raw.id));
  }
}