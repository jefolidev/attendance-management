import type { FastifyReply, FastifyRequest } from 'fastify'
import {
	importBackupWorkbook,
	parseBackupWorkbook,
	validateBackupDatasetAgainstDatabase,
} from '@src/infra/database/prisma/data-transfer-workbook'

export class AdminDataImportController {
	constructor(private readonly prisma: any) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		let file
		try {
			file = await request.file()
		} catch {
			reply.status(400).send({ error: 'Envie um único arquivo .xlsx de até 100 MB.' })
			return
		}
		if (!file || !file.filename.toLowerCase().endsWith('.xlsx')) {
			reply.status(400).send({ error: 'Envie um arquivo .xlsx no campo multipart file.' })
			return
		}

		let buffer: Buffer
		try {
			buffer = await file.toBuffer()
		} catch {
			reply.status(413).send({ error: 'Arquivo excede o limite de 100 MB.' })
			return
		}

		const parsed = await parseBackupWorkbook(buffer)
		if (!parsed.data) {
			reply.status(422).send({
				error: 'A planilha tem erros. Nenhum dado foi gravado.',
				totalIssues: parsed.issues.length,
				issues: parsed.issues.slice(0, 200),
			})
			return
		}

		const databaseIssues = await validateBackupDatasetAgainstDatabase(this.prisma, parsed.data)
		if (databaseIssues.length) {
			reply.status(409).send({
				error: 'Há conflitos com dados já existentes. Nenhum dado foi gravado.',
				totalIssues: databaseIssues.length,
				issues: databaseIssues.slice(0, 200),
			})
			return
		}

		try {
			await importBackupWorkbook(this.prisma, parsed.data)
		} catch (error) {
			reply.status(409).send({
				error: 'A importação foi revertida; nenhum dado parcial foi gravado.',
				detail: error instanceof Error ? error.message : 'Conflito de dados no banco.',
		})
			return
		}

		reply.status(200).send({
			message: 'Importação concluída.',
			imported: Object.fromEntries(Object.entries(parsed.data).map(([key, rows]) => [key, rows.length])),
		})
	}
}
