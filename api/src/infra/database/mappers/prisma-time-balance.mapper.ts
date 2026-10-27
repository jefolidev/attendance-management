import { UniqueEntityId } from "@src/core/entities/unique-entity-id";
import { TimeBalance as TimeBalanceDomain } from "@src/domain/manage/enterprise/entities/time-balance";
import type { TimeBalanceEntryProps } from "@src/domain/manage/enterprise/entities/time-balance-entry";
import {
    type Prisma,
    type TimeBalance,
} from "../../../../generated/prisma/client.ts";
import { PrismaTimeBalanceEntryMapper } from "./prisma-time-balance-entry.mapper.ts";

type PrismaTimeBalanceWithEvents = Prisma.TimeBalanceGetPayload<{
  include: { events: true };
}>;

export class PrismaTimeBalanceMapper {
  static toPrisma(
    balance: TimeBalanceDomain,
  ): TimeBalance {
    return {
      id: balance.id.toString(),
      balanceMinutes: balance.balanceMinutes,
      employeeId: balance.employeeId.toString(),
      updatedAt: balance.updatedAt || null,
    };
  }

  static toDomain(raw: PrismaTimeBalanceWithEvents): TimeBalanceDomain {
    const events: TimeBalanceEntryProps[] = raw.events.map((event) => {
      const domainEvent = PrismaTimeBalanceEntryMapper.toDomain(event);

      return {
        employeeId: domainEvent.employeeId,
        type: domainEvent.type,
        reason: domainEvent.reason,
        durationInMinutes: domainEvent.durationInMinutes,
        createdAt: domainEvent.createdAt,
      };
    });

    return TimeBalanceDomain.create(
      {
        employeeId: new UniqueEntityId(raw.employeeId),
        events,
        balanceMinutes: raw.balanceMinutes,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }
}
