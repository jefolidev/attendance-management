import { createBackupWorkbook } from '@src/infra/database/prisma/data-transfer-workbook';
import type { FastifyReply, FastifyRequest } from 'fastify';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export class AdminDataExportController {
	constructor(private readonly prisma: any) {}

	async handle(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
		const buffer = await createBackupWorkbook(this.prisma)
		reply
			.header('Content-Type', XLSX_MIME)
			.header('Content-Disposition', 'attachment; filename="ponto-digital-backup.xlsx"')
			.header('Cache-Control', 'no-store')
			.send(buffer)
	}
}
