import type { PrismaClient } from "../../../../../generated/prisma/client.ts";
import type { TimeBalanceEntryRepository } from "@src/domain/manage/application/repositories/time-balance-entry.repository";
import type { TimeBalanceEntryReason } from "@src/domain/manage/enterprise/entities/time-balance-entry";

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
