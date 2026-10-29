import type { PrismaClient } from "../../../../../generated/prisma/client.ts";
import type { PaginationParams } from "@src/core/repositories/pagination";
import type { TimeBalanceRepository } from "@src/domain/manage/application/repositories/time-balance.repository";
import type { TimeBalance } from "@src/domain/manage/enterprise/entities/time-balance";
import { PrismaTimeBalanceMapper } from "../../mappers/prisma-time-balance.mapper.ts";

export class PrismaTimeBalanceRepository implements TimeBalanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(timeBalance: TimeBalance): Promise<void> {
    await this.prisma.timeBalance.create({
      data: {
        id: timeBalance.id.toString(),
        employeeId: timeBalance.employeeId.toString(),
        balanceMinutes: timeBalance.balanceMinutes,
      },
    });
  }

  async findById(id: string): Promise<TimeBalance | null> {
    const timeBalance = await this.prisma.timeBalance.findUnique({
      where: { id },
      include: { events: true },
    });

    return timeBalance ? PrismaTimeBalanceMapper.toDomain(timeBalance) : null;
  }

  async findManyByIdEmployeeId(
    employeeId: string,
    { page }: PaginationParams,
  ): Promise<TimeBalance[]> {
    const pageSize = 20;
    const timeBalances = await this.prisma.timeBalance.findMany({
      where: { employeeId },
      include: { events: true },
      skip: Math.max(0, page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    });

    return timeBalances.map(PrismaTimeBalanceMapper.toDomain);
  }

  async findByEmployeeId(employeeId: string): Promise<TimeBalance | null> {
    const timeBalance = await this.prisma.timeBalance.findUnique({
      where: { employeeId },
      include: { events: true },
    });

    return timeBalance ? PrismaTimeBalanceMapper.toDomain(timeBalance) : null;
  }

  async update(timeBalance: TimeBalance): Promise<void> {
    await this.prisma.timeBalance.update({
      where: { id: timeBalance.id.toString() },
      data: {
        balanceMinutes: timeBalance.balanceMinutes,
        employeeId: timeBalance.employeeId.toString(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.timeBalance.delete({ where: { id } });
  }
}
