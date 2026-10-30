import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import type { TokenInvalidator } from '@src/domain/manage/application/cryptograhpy/token-invalidator'
import { InMemoryTokenInvalidator } from '../cryptography/in-memory-token-invalidator'

declare module 'fastify' {
	interface FastifyInstance {
		tokenInvalidator: TokenInvalidator
	}
}

const tokenInvalidatorPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('tokenInvalidator', new InMemoryTokenInvalidator())
}

export default fp(tokenInvalidatorPlugin)
