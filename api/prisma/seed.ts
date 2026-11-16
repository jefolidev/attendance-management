import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hash } from 'bcryptjs'
import { PrismaClient } from '../generated/prisma/client.ts'

const databaseUrl = process.env.DATABASE_URL
const username = process.env.SEED_ADMIN_USERNAME ?? 'jefersonfranco'
const password = process.env.SEED_ADMIN_PASSWORD

if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is not defined')
}

if (!password) {
	console.info('Skipping admin seed because SEED_ADMIN_PASSWORD is not set.')
} else {
	const prisma = new PrismaClient({
		adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
	})

	try {
		const existingAdmin = await prisma.employee.findUnique({ where: { username } })

		if (existingAdmin) {
			if (existingAdmin.role !== 'ADMIN') {
				await prisma.employee.update({
					where: { id: existingAdmin.id },
					data: { role: 'ADMIN' },
				})
			}

			console.log(`Admin account ${username} already exists.`)
		} else {
			await prisma.employee.create({
				data: {
					username,
					password: await hash(password, 8),
					role: 'ADMIN',
				},
			})

			console.log(`Admin account ${username} created.`)
		}
	} finally {
		await prisma.$disconnect()
	}
}
