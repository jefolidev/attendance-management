import { NotFoundError } from "@src/core/entities/errors/not-found-error";
import type { UpdateWorkScheduleUseCase } from "@src/domain/manage/application/use-cases/update-work-schedule";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const updateWorkScheduleBodySchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    lateTolerance: z.number().int().nonnegative().optional(),
    breaksPerDay: z.number().int().nonnegative().optional(),
    days: z.array(z.number().int().min(0).max(6)).nonempty().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided",
  });

export class UpdateWorkScheduleController {
  constructor(
    private readonly updateWorkScheduleUseCase: UpdateWorkScheduleUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = updateWorkScheduleBodySchema.parse(request.body);
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.updateWorkScheduleUseCase.execute({
        ...body,
        requesterId: requester.id as string,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message });
        }
      }

      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
