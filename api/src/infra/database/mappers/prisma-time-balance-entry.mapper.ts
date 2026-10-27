import { UniqueEntityId } from "@src/core/entities/unique-entity-id";
import {
    TimeBalanceEntry as TimeBalanceEntryDomain,
    type TimeBalanceEntryReason as DomainReason,
    type TimeBalanceEntryType as DomainType,
} from "@src/domain/manage/enterprise/entities/time-balance-entry";
import {
    type TimeBalanceEntry,
    type TimeBalanceEntryReason,
    type TimeBalanceEntryType,
} from "../../../../generated/prisma/client.ts";

export class PrismaTimeBalanceEntryMapper {
  static toPrisma(
    entry: TimeBalanceEntryDomain,
  ): 
    TimeBalanceEntry
  {
    return {
      id: entry.id.toString(),
      type: entry.type as TimeBalanceEntryType,
      reason: entry.reason as TimeBalanceEntryReason,
      durationInMinutes: entry.durationInMinutes,
      employeeId: entry.employeeId.toString(),
    };
  }

  static toDomain(raw: TimeBalanceEntry): TimeBalanceEntryDomain {
    return TimeBalanceEntryDomain.create(
      {
        employeeId: new UniqueEntityId(raw.employeeId),
        type: raw.type as DomainType,
        reason: raw.reason as DomainReason,
        durationInMinutes: raw.durationInMinutes,
        createdAt: new Date(),
      },
      new UniqueEntityId(raw.id),
    );
  }
}
