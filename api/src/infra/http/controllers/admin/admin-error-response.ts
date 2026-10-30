import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { DuplicatedError } from '@src/core/entities/errors/duplicated-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { FastifyReply } from 'fastify'
import { ZodError } from 'zod'

export function sendAdminError(error: unknown, reply: FastifyReply): void {
	if (error instanceof ZodError) {
		reply.status(400).send({ error: error.message })
		return
	}

	if (error instanceof NotAllowedError) {
		reply.status(403).send({ error: error.message })
		return
	}

	if (error instanceof NotFoundError) {
		reply.status(404).send({ error: error.message })
		return
	}

	if (error instanceof DuplicatedError) {
		reply.status(409).send({ error: error.message })
		return
	}

	if (error instanceof BadRequestError) {
		reply.status(400).send({ error: error.message })
		return
	}

	reply.status(500).send({ error: 'An unexpected error occurred' })
}
