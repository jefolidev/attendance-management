import type { FastifyReply, FastifyRequest } from 'fastify'
import { createBackupTemplateWorkbook } from '@src/infra/database/prisma/data-transfer-workbook'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export class AdminDataTemplateController {
	async handle(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
		const buffer = await createBackupTemplateWorkbook()
		reply
			.header('Content-Type', XLSX_MIME)
			.header('Content-Disposition', 'attachment; filename="ponto-digital-template.xlsx"')
			.header('Cache-Control', 'no-store')
			.send(buffer)
	}
}
