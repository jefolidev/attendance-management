import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { sendPushToEmployee, type PushMessage } from './web-push.ts'

dayjs.extend(utc)
dayjs.extend(timezone)

const scheduleTimezone = 'America/Fortaleza'
const reminderMinutes = 10
const scanIntervalMs = 30_000

type ReminderKind = 'START_REMINDER' | 'MISSED_CLOCK_IN' | 'END_REMINDER' | 'MISSED_CLOCK_OUT'

const reminderMessages: Record<ReminderKind, (time: string) => PushMessage> = {
	START_REMINDER: (time) => ({
		title: 'Seu expediente começa em breve',
		body: `Faltam ${reminderMinutes} minutos para o horário de entrada (${time}).`,
	}),
	MISSED_CLOCK_IN: (time) => ({
		title: 'Entrada ainda não registrada',
		body: `O horário de entrada (${time}) já passou. Registre seu ponto.`,
	}),
	END_REMINDER: (time) => ({
		title: 'Seu expediente está perto do fim',
		body: `Faltam ${reminderMinutes} minutos para o horário previsto de saída (${time}).`,
	}),
	MISSED_CLOCK_OUT: (time) => ({
		title: 'Saída ainda não registrada',
		body: `O horário previsto de saída (${time}) já passou. Registre seu ponto.`,
	}),
}

async function claimDelivery(fastify: FastifyInstance, employeeId: string, dateKey: string, kind: ReminderKind) {
	try {
		await fastify.prisma.timeClockNotificationDelivery.create({
			data: { employeeId, dateKey, kind },
		})
		return true
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return false
		throw error
	}
}

async function sendScheduledNotification(
	fastify: FastifyInstance,
	employeeId: string,
	dateKey: string,
	kind: ReminderKind,
	time: string,
) {
	if (!(await claimDelivery(fastify, employeeId, dateKey, kind))) return

	try {
		const delivered = await sendPushToEmployee(
			fastify.prisma,
			employeeId,
			reminderMessages[kind](time),
		)
		if (delivered === 0) {
			await fastify.prisma.timeClockNotificationDelivery.deleteMany({
				where: { employeeId, dateKey, kind },
			})
		}
	} catch (error) {
		await fastify.prisma.timeClockNotificationDelivery.deleteMany({
			where: { employeeId, dateKey, kind },
		})
		throw error
	}
}

async function scanSchedules(fastify: FastifyInstance) {
	const now = dayjs().tz(scheduleTimezone)
	const dateKey = now.format('YYYY-MM-DD')
	const dayOfWeek = now.day()
	const weekdayField = [
		'sunday',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
	][dayOfWeek] as 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
	const schedules = (await fastify.prisma.workSchedule.findMany({
		include: { dayOverrides: true, workDaysWorkSchedules: { include: { workDays: true } } },
	})).filter((schedule) =>
	schedule.workDaysWorkSchedules.some((workDaysSchedule) => workDaysSchedule.workDays[weekdayField]),
	)
	const startOfDay = now.startOf('day').toDate()
	const endOfDay = now.add(1, 'day').startOf('day').toDate()

	for (const schedule of schedules) {
		const employeeId = schedule.employeeId
		const override = schedule.dayOverrides.find((day) => day.dayOfWeek === dayOfWeek)
		const startTime = override?.startTime ?? schedule.startTime
		const endTime = override?.endTime ?? schedule.endTime
		const startAt = dayjs.tz(`${dateKey}T${startTime}:00`, scheduleTimezone)
		const endAt = dayjs.tz(`${dateKey}T${endTime}:00`, scheduleTimezone)
		const entry = await fastify.prisma.timeEntry.findFirst({
			where: {
				employeeId,
				clockIn: { gte: startOfDay, lt: endOfDay },
			},
			orderBy: { clockIn: 'asc' },
		})

		if (!entry && now.isAfter(startAt.subtract(reminderMinutes, 'minute'))) {
			if (now.isBefore(startAt)) {
				await sendScheduledNotification(fastify, employeeId, dateKey, 'START_REMINDER', startTime)
			} else {
				await sendScheduledNotification(fastify, employeeId, dateKey, 'MISSED_CLOCK_IN', startTime)
			}
		}

		if (entry && !entry.clockOut && now.isAfter(endAt.subtract(reminderMinutes, 'minute'))) {
			if (now.isBefore(endAt)) {
				await sendScheduledNotification(fastify, employeeId, dateKey, 'END_REMINDER', endTime)
			} else {
				await sendScheduledNotification(fastify, employeeId, dateKey, 'MISSED_CLOCK_OUT', endTime)
			}
		}
	}
}

const timeClockPushSchedulerPlugin: FastifyPluginAsync = async (fastify) => {
	let timer: ReturnType<typeof setInterval> | undefined
	let isRunning = false
	const scan = async () => {
		if (isRunning || !process.env.WEB_PUSH_VAPID_PUBLIC_KEY || !process.env.WEB_PUSH_VAPID_PRIVATE_KEY) return
		isRunning = true
		try {
			await scanSchedules(fastify)
		} catch {
			fastify.log.error('Could not send scheduled time clock notifications')
		} finally {
			isRunning = false
		}
	}

	fastify.addHook('onReady', async () => {
		void scan()
		timer = setInterval(() => void scan(), scanIntervalMs)
	})
	fastify.addHook('onClose', async () => {
		if (timer) clearInterval(timer)
	})
}

export default fp(timeClockPushSchedulerPlugin, {
	name: 'time-clock-push-scheduler',
	dependencies: ['prisma-plugin'],
})
