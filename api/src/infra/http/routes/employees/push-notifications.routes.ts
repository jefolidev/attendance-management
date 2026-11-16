import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getWebPushConfig, sendPushToEmployee } from '../../../notifications/web-push.ts'

function isKnownPushService(value: string) {
	const hostname = new URL(value).hostname.toLowerCase()
	return hostname === 'fcm.googleapis.com' ||
		hostname === 'updates.push.services.mozilla.com' ||
		hostname.endsWith('.push.services.mozilla.com') ||
		hostname === 'web.push.apple.com' ||
		hostname.endsWith('.notify.windows.com')
}

const subscriptionSchema = z.object({
	endpoint: z.string().url().refine((value) =>
		new URL(value).protocol === 'https:' && isKnownPushService(value),
	),
	keys: z.object({
		p256dh: z.string().min(1),
		auth: z.string().min(1),
	}),
	replaceExisting: z.boolean().optional(),
})

const endpointSchema = z.object({ endpoint: z.string().url() })

const pushNotificationsRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get('/employees/push-notifications/config', async (_request, reply) => {
		const config = getWebPushConfig()
		if (!config.enabled) return reply.status(503).send({ error: 'Web Push is not configured on the server' })
		return reply.send({ publicKey: config.publicKey })
	})

	fastify.post('/employees/push-notifications/subscriptions', async (request, reply) => {
		if (request.auth?.role !== 'EMPLOYEE') return reply.status(403).send({ error: 'Only employees can subscribe to notifications' })

		const parsed = subscriptionSchema.safeParse(request.body)
		if (!parsed.success) return reply.status(400).send({ error: 'Invalid push subscription' })

		const existing = await fastify.prisma.employeePushSubscription.findUnique({
			where: { endpoint: parsed.data.endpoint },
		})
		if (existing && existing.employeeId !== request.auth.id && !parsed.data.replaceExisting) {
			return reply.status(409).send({ error: 'Este navegador está vinculado a outra conta. Ative os alertas para transferi-lo para esta conta.' })
		}

		await fastify.prisma.employeePushSubscription.upsert({
			where: { endpoint: parsed.data.endpoint },
			create: {
				employeeId: request.auth.id,
				endpoint: parsed.data.endpoint,
				p256dh: parsed.data.keys.p256dh,
				auth: parsed.data.keys.auth,
			},
			update: {
				employeeId: request.auth.id,
				p256dh: parsed.data.keys.p256dh,
				auth: parsed.data.keys.auth,
			},
		})

		return reply.status(201).send({ subscribed: true })
	})

	fastify.delete('/employees/push-notifications/subscriptions', async (request, reply) => {
		if (request.auth?.role !== 'EMPLOYEE') return reply.status(403).send({ error: 'Only employees can manage notification subscriptions' })
		const parsed = endpointSchema.safeParse(request.body)
		if (!parsed.success) return reply.status(400).send({ error: 'Invalid push subscription endpoint' })

		await fastify.prisma.employeePushSubscription.deleteMany({
			where: { employeeId: request.auth.id, endpoint: parsed.data.endpoint },
		})
		return reply.status(204).send()
	})

	fastify.post('/employees/push-notifications/test', async (request, reply) => {
		if (request.auth?.role !== 'EMPLOYEE') return reply.status(403).send({ error: 'Only employees can test notifications' })
		if (!getWebPushConfig().enabled) return reply.status(503).send({ error: 'Web Push is not configured on the server' })

		try {
			const sent = await sendPushToEmployee(fastify.prisma, request.auth.id, {
				title: 'Notificação de teste',
				body: 'As notificações do Ponto Digital estão funcionando neste dispositivo.',
				tag: 'ponto-digital-push-test',
			})
			if (sent === 0) return reply.status(404).send({ error: 'No active notification subscription was found' })
			return reply.send({ sent })
		} catch {
			fastify.log.error('Could not send test push notification')
			return reply.status(502).send({ error: 'Could not send a test notification' })
		}
	})
}

export default pushNotificationsRoutes
