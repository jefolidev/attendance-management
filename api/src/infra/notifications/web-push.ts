import { sendNotification, setVapidDetails } from 'web-push'
import type { PrismaClient } from '../../../generated/prisma/client.ts'

export interface PushMessage {
	title: string
	body: string
	tag?: string
}

function getVapidConfig() {
	const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY
	const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY
	const subject = process.env.WEB_PUSH_VAPID_SUBJECT ?? 'mailto:notifications@ponto-digital.local'

	if (!publicKey || !privateKey) return null

	return { publicKey, privateKey, subject }
}

function configureVapid() {
	const config = getVapidConfig()
	if (!config) throw new Error('Web Push VAPID keys are not configured')
	setVapidDetails(config.subject, config.publicKey, config.privateKey)
}

export function getWebPushConfig() {
	const config = getVapidConfig()
	return { publicKey: config?.publicKey ?? null, enabled: config !== null }
}

export async function sendPushToEmployee(
	prisma: PrismaClient,
	employeeId: string,
	message: PushMessage,
): Promise<number> {
	configureVapid()
	const subscriptions = await prisma.employeePushSubscription.findMany({
		where: { employeeId },
	})

	const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
		try {
			await sendNotification(
				{
					endpoint: subscription.endpoint,
					keys: { p256dh: subscription.p256dh, auth: subscription.auth },
				},
				JSON.stringify(message),
				{ TTL: 60 * 60 },
			)
			return true
		} catch (error) {
			const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
				? Number((error as { statusCode: unknown }).statusCode)
				: undefined
			if (statusCode === 404 || statusCode === 410) {
				await prisma.employeePushSubscription.deleteMany({ where: { id: subscription.id } })
			}
			throw error
		}
	}))

	return results.filter((result) => result.status === 'fulfilled' && result.value).length
}
