import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import type { FastifyInstance } from 'fastify'
import { CreateEmployeeUseCase } from '@src/domain/manage/application/use-cases/create-employee'
import { GetEmployeeBalanceUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-balance'
import { GetEmployeeDelaysUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-delays'
import { GetEmployeeEntriesUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-entries'
import { GetEmployeeWorkScheduleUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-work-schedule'
import { ListEmployeesUseCase } from '@src/domain/manage/application/use-cases/admin/list-employees'
import { UpdateEmployeePasswordUseCase } from '@src/domain/manage/application/use-cases/admin/update-employee-password'
import { UpdateEmployeeWorkScheduleUseCase } from '@src/domain/manage/application/use-cases/admin/update-employee-work-schedule'
import { UpdateEmployeeTimeEntryUseCase } from '@src/domain/manage/application/use-cases/admin/update-employee-time-entry'
import { BcryptHasher } from '@src/infra/cryptography/bcrypt-hasher'
import { PrismaEmployeeRepository } from '@src/infra/database/prisma/repositories/prisma-employee.repository'
import { PrismaTimeBalanceRepository } from '@src/infra/database/prisma/repositories/prisma-time-balance.repository'
import { PrismaTimeBalanceEntryRepository } from '@src/infra/database/prisma/repositories/prisma-time-balance-entry.repository'
import { PrismaTimeEntryRepository } from '@src/infra/database/prisma/repositories/prisma-time-entry.repository'
import { PrismaWorkScheduleRepository } from '@src/infra/database/prisma/repositories/prisma-work-schedule.repository'
import { adminRouteConfig } from '@src/infra/plugins/auth-guard'
import {
	AdminCreateEmployeeController,
	adminCreateEmployeeBodySchema,
} from '../../controllers/admin-create-employee.controller'
import { GetEmployeeBalanceController } from '../../controllers/get-employee-balance.controller'
import {
	GetEmployeeDelaysController,
	adminListDelaysQuerySchema,
} from '../../controllers/get-employee-delays.controller'
import {
	GetEmployeeEntriesController,
	adminListEntriesQuerySchema,
} from '../../controllers/get-employee-entries.controller'
import { ListEmployeesController } from '../../controllers/list-employees.controller'
import { adminListEmployeesQuerySchema } from '../../controllers/list-employees.controller'
import { GetEmployeeWorkScheduleController } from '../../controllers/get-employee-work-schedule.controller'
import {
	UpdateEmployeePasswordController,
	employeeIdParamsSchema,
	updateEmployeePasswordBodySchema,
} from '../../controllers/update-employee-password.controller'
import {
	UpdateEmployeeWorkScheduleController,
	updateEmployeeWorkScheduleBodySchema,
} from '../../controllers/update-employee-work-schedule.controller'
import {
	UpdateEmployeeTimeEntryController,
	updateEmployeeTimeEntryBodySchema,
	updateEmployeeTimeEntryParamsSchema,
} from '../../controllers/update-employee-time-entry.controller'

export default async function adminRoutes(fastify: FastifyInstance): Promise<void> {
	const employeeRepository = new PrismaEmployeeRepository(fastify.prisma)
	const timeBalanceRepository = new PrismaTimeBalanceRepository(fastify.prisma)
	const timeEntryRepository = new PrismaTimeEntryRepository(fastify.prisma)
	const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma)
	const hashGenerator = new BcryptHasher()

	const listEmployeesController = new ListEmployeesController(
		new ListEmployeesUseCase(employeeRepository),
	)
	const createEmployeeController = new AdminCreateEmployeeController(
		new CreateEmployeeUseCase(employeeRepository, hashGenerator),
	)
	const updateEmployeePasswordController = new UpdateEmployeePasswordController(
		new UpdateEmployeePasswordUseCase(employeeRepository, hashGenerator),
	)
	const getEmployeeEntriesController = new GetEmployeeEntriesController(
		new GetEmployeeEntriesUseCase(
			employeeRepository,
			workScheduleRepository,
			timeEntryRepository,
		),
	)
	const getEmployeeBalanceController = new GetEmployeeBalanceController(
		new GetEmployeeBalanceUseCase(employeeRepository, timeBalanceRepository),
	)
	const getEmployeeWorkScheduleController = new GetEmployeeWorkScheduleController(
		new GetEmployeeWorkScheduleUseCase(employeeRepository, workScheduleRepository),
	)
	const getEmployeeDelaysController = new GetEmployeeDelaysController(
		new GetEmployeeDelaysUseCase(
			employeeRepository,
			workScheduleRepository,
			timeEntryRepository,
		),
	)
	const updateEmployeeWorkScheduleController =
		new UpdateEmployeeWorkScheduleController(
			new UpdateEmployeeWorkScheduleUseCase(
				employeeRepository,
				workScheduleRepository,
			),
		)
	const updateEmployeeTimeEntryController = new UpdateEmployeeTimeEntryController(
		new UpdateEmployeeTimeEntryUseCase(
			employeeRepository,
			timeEntryRepository,
			workScheduleRepository,
			timeBalanceRepository,
			new PrismaTimeBalanceEntryRepository(fastify.prisma),
		),
	)

	const route = fastify.withTypeProvider<ZodTypeProvider>()

	route.route({
		method: 'GET',
		url: '/admin/employees',
		config: adminRouteConfig,
		schema: {
			querystring: adminListEmployeesQuerySchema,
			tags: ['admin', 'employees'],
		},
		handler: listEmployeesController.handle.bind(listEmployeesController),
	})

	route.route({
		method: 'POST',
		url: '/admin/employees',
		config: adminRouteConfig,
		schema: {
			body: adminCreateEmployeeBodySchema,
			tags: ['admin', 'employees'],
		},
		handler: createEmployeeController.handle.bind(createEmployeeController),
	})

	route.route({
		method: 'PATCH',
		url: '/admin/employees/:employeeId/password',
		config: adminRouteConfig,
		schema: {
			params: employeeIdParamsSchema,
			body: updateEmployeePasswordBodySchema,
			tags: ['admin', 'employees'],
		},
		handler: updateEmployeePasswordController.handle.bind(
			updateEmployeePasswordController,
		),
	})

	route.route({
		method: 'GET',
		url: '/admin/employees/:employeeId/time-entries',
		config: adminRouteConfig,
		schema: {
			params: employeeIdParamsSchema,
			querystring: adminListEntriesQuerySchema,
			tags: ['admin', 'time-entries'],
		},
		handler: getEmployeeEntriesController.handle.bind(getEmployeeEntriesController),
	})

	route.route({
		method: 'GET',
		url: '/admin/employees/:employeeId/time-balance',
		config: adminRouteConfig,
		schema: {
			params: employeeIdParamsSchema,
			tags: ['admin', 'time-balance'],
		},
		handler: getEmployeeBalanceController.handle.bind(getEmployeeBalanceController),
	})

	route.route({
		method: 'GET',
		url: '/admin/employees/:employeeId/work-schedule',
		config: adminRouteConfig,
		schema: {
			params: employeeIdParamsSchema,
			tags: ['admin', 'work-schedule'],
		},
		handler: getEmployeeWorkScheduleController.handle.bind(
			getEmployeeWorkScheduleController,
		),
	})

	route.route({
		method: 'GET',
		url: '/admin/employees/:employeeId/delays',
		config: adminRouteConfig,
		schema: {
			params: employeeIdParamsSchema,
			querystring: adminListDelaysQuerySchema,
			tags: ['admin', 'delays'],
		},
		handler: getEmployeeDelaysController.handle.bind(getEmployeeDelaysController),
	})

	route.route({
		method: 'PATCH',
		url: '/admin/employees/:employeeId/work-schedule',
		config: adminRouteConfig,
		schema: {
			params: employeeIdParamsSchema,
			body: updateEmployeeWorkScheduleBodySchema,
			tags: ['admin', 'work-schedule'],
		},
		handler: updateEmployeeWorkScheduleController.handle.bind(
			updateEmployeeWorkScheduleController,
		),
	})

	route.route({
		method: 'PATCH',
		url: '/admin/employees/:employeeId/time-entries/:timeEntryId',
		config: adminRouteConfig,
		schema: {
			params: updateEmployeeTimeEntryParamsSchema,
			body: updateEmployeeTimeEntryBodySchema,
			tags: ['admin', 'time-entries'],
		},
		handler: updateEmployeeTimeEntryController.handle.bind(
			updateEmployeeTimeEntryController,
		),
	})
}
