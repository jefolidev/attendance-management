import type { PrismaClient } from "../../../../../generated/prisma/client.ts";
import type { TimeBalanceEntryRepository } from "@src/domain/manage/application/repositories/time-balance-entry.repository";
import {
  AUTOMATIC_TIME_BALANCE_ENTRY_REASONS,
  type TimeBalanceEntryReason,
} from "@src/domain/manage/enterprise/entities/time-balance-entry";
import type { AutomaticTimeBalanceEntry } from "@src/domain/manage/application/repositories/time-balance-entry.repository";

export class PrismaTimeBalanceEntryRepository
  implements TimeBalanceEntryRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async addDebitEntry(
    employeeId: string,
    amount: number,
    reason: TimeBalanceEntryReason,
  ): Promise<void> {
    await this.addEntry(employeeId, amount, reason, "DEBIT");
  }

  async addCreditEntry(
    employeeId: string,
    amount: number,
    reason: TimeBalanceEntryReason,
  ): Promise<void> {
    await this.addEntry(employeeId, amount, reason, "CREDIT");
  }

  async replaceAutomaticEntries(
    employeeId: string,
    entries: AutomaticTimeBalanceEntry[],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const timeBalance = await transaction.timeBalance.findUnique({
        where: { employeeId },
      });
      const preservedEntries = await transaction.timeBalanceEntry.findMany({
        where: {
          employeeId,
          reason: { notIn: [...AUTOMATIC_TIME_BALANCE_ENTRY_REASONS] },
        },
        select: { type: true, durationInMinutes: true },
      });
      const preservedBalance = preservedEntries.reduce(
        (total, entry) =>
          total +
          (entry.type === "CREDIT"
            ? entry.durationInMinutes
            : -entry.durationInMinutes),
        0,
      );
      const automaticBalance = entries.reduce(
        (total, entry) =>
          total +
          (entry.type === "CREDIT"
            ? entry.durationInMinutes
            : -entry.durationInMinutes),
        0,
      );
      const balanceMinutes = preservedBalance + automaticBalance;

      await transaction.timeBalanceEntry.deleteMany({
        where: {
          employeeId,
          reason: { in: [...AUTOMATIC_TIME_BALANCE_ENTRY_REASONS] },
        },
      });

      if (!timeBalance && entries.length === 0) return;

      const targetBalance =
        timeBalance ??
        (await transaction.timeBalance.create({
          data: { employeeId, balanceMinutes: 0 },
        }));

      if (entries.length > 0) {
        await transaction.timeBalanceEntry.createMany({
          data: entries.map((entry) => ({
            employeeId,
            timeBalanceId: targetBalance.id,
            type: entry.type,
            reason: entry.reason,
            durationInMinutes: entry.durationInMinutes,
          })),
        });
      }

      await transaction.timeBalance.update({
        where: { id: targetBalance.id },
        data: { balanceMinutes },
      });
    });
  }

  private async addEntry(
    employeeId: string,
    amount: number,
    reason: TimeBalanceEntryReason,
    type: "CREDIT" | "DEBIT",
  ): Promise<void> {
    if (amount <= 0) return;

    await this.prisma.$transaction(async (transaction) => {
      const timeBalance = await transaction.timeBalance.findUnique({
        where: { employeeId },
      });

      if (!timeBalance) {
        throw new Error("Time balance not found for this employee");
      }

      await transaction.timeBalanceEntry.create({
        data: {
          employeeId,
          timeBalanceId: timeBalance.id,
          type,
          reason,
          durationInMinutes: amount,
        },
      });

      await transaction.timeBalance.update({
        where: { id: timeBalance.id },
        data: {
          balanceMinutes:
            timeBalance.balanceMinutes + (type === "CREDIT" ? amount : -amount),
        },
      });
    });
  }
}
