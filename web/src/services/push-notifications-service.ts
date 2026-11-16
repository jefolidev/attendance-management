import { api } from '@/lib/api'

interface PushConfig {
	publicKey: string
}

interface PushSubscriptionPayload {
	endpoint: string
	keys: {
		p256dh: string
		auth: string
	}
}

export async function getPushConfig() {
	const { data } = await api.get<PushConfig>('/employees/push-notifications/config')
	return data
}

export async function savePushSubscription(subscription: PushSubscriptionPayload, replaceExisting = false) {
	await api.post('/employees/push-notifications/subscriptions', { ...subscription, replaceExisting })
}

export async function deletePushSubscription(endpoint: string) {
	await api.delete('/employees/push-notifications/subscriptions', { data: { endpoint } })
}

