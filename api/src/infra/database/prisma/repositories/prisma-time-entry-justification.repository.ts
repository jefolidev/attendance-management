import type { PrismaClient } from '../../../../../generated/prisma/client.ts'
import type { TimeEntryJustificationRepository } from '@src/domain/manage/application/repositories/time-entry-justification.repository'
import type { TimeEntryJustification } from '@src/domain/manage/enterprise/entities/time-entry-justification'
import { PrismaTimeEntryJustificationMapper } from '../../mappers/prisma-time-entry-justification.mapper'

export class PrismaTimeEntryJustificationRepository
	implements TimeEntryJustificationRepository
{
	constructor(private readonly prisma: PrismaClient) {}

	async create(justification: TimeEntryJustification): Promise<void> {
		await this.prisma.timeEntryJustification.create({
			data: PrismaTimeEntryJustificationMapper.toPrisma(justification),
		})
	}

	async findByTimeEntryId(timeEntryId: string): Promise<TimeEntryJustification[]> {
		const justifications = await this.prisma.timeEntryJustification.findMany({
			where: { timeEntryId },
			orderBy: { createdAt: 'desc' },
		})

		return justifications.map(PrismaTimeEntryJustificationMapper.toDomain)
	}

	async findByEmployeeId(employeeId: string): Promise<TimeEntryJustification[]> {
		const justifications = await this.prisma.timeEntryJustification.findMany({
			where: { employeeId },
			orderBy: { createdAt: 'asc' },
		})

		return justifications.map(PrismaTimeEntryJustificationMapper.toDomain)
	}

	async findByTimeEntryAndType(
		timeEntryId: string,
		type: TimeEntryJustification['type'],
	): Promise<TimeEntryJustification | null> {
		const justification = await this.prisma.timeEntryJustification.findFirst({
			where: { timeEntryId, type },
		})

		return justification
			? PrismaTimeEntryJustificationMapper.toDomain(justification)
			: null
	}

	async delete(id: string): Promise<void> {
		await this.prisma.timeEntryJustification.delete({ where: { id } })
	}
}
