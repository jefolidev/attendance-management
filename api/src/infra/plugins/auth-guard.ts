import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

export type AuthenticatedUser = {
	id: string
	role: 'ADMIN' | 'EMPLOYEE'
}

export type RouteAuthConfig = {
	public?: boolean
	adminOnly?: boolean
}

declare module 'fastify' {
	interface FastifyContextConfig {
		public?: boolean
		adminOnly?: boolean
	}

	interface FastifyRequest {
		auth?: AuthenticatedUser
	}
}

export const publicRouteConfig: RouteAuthConfig = { public: true }
export const adminRouteConfig: RouteAuthConfig = { adminOnly: true }

function getRouteAuthConfig(request: FastifyRequest): RouteAuthConfig {
	return (request.routeOptions.config ?? {}) as RouteAuthConfig
}

const authGuardPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.addHook('onRequest', async (request, reply) => {
		const config = getRouteAuthConfig(request)

		if (config.public) {
			return
		}

		const token = fastify.jwtAuth.getTokenByCookieOrHeader(request)

		if (!token) {
			reply.status(401).send({ error: 'Unauthorized' })
			return
		}

		try {
			const payload = fastify.jwt.verify<{
				id?: unknown
				role?: unknown
			}>(token)

			if (
				typeof payload.id !== 'string' ||
				(payload.role !== 'ADMIN' && payload.role !== 'EMPLOYEE')
			) {
				throw new Error('Invalid token payload')
			}

			request.auth = {
				id: payload.id,
				role: payload.role,
			}
		} catch {
			reply.status(401).send({ error: 'Invalid token' })
			return
		}

		if (config.adminOnly && request.auth?.role !== 'ADMIN') {
			reply.status(403).send({ error: 'Only admins can access this route' })
		}
	})
}

export default fp(authGuardPlugin)
