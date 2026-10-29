import { BadRequestError } from "@src/core/entities/errors/bad-request-error";
import { DuplicatedError } from "@src/core/entities/errors/duplicated-error";
import { NotFoundError } from "@src/core/entities/errors/not-found-error";
import type { CreateWorkScheduleUseCase } from "@src/domain/manage/application/use-cases/create-work-schedule";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const createWorkScheduleBodySchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  lateTolerance: z.number().int().nonnegative(),
  breaksPerDay: z.number().int().nonnegative(),
  days: z.array(z.number().int().min(0).max(6)).nonempty(),
});

export type CreateWorkScheduleBody = z.infer<typeof createWorkScheduleBodySchema>

export class CreateWorkScheduleController {
  constructor(private readonly createWorkScheduleUseCase: CreateWorkScheduleUseCase, private readonly fastify: FastifyInstance) {}

  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const { startTime, endTime, lateTolerance, breaksPerDay, days } = createWorkScheduleBodySchema.parse(request.body);


    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if(!token) {
      response.status(401).send({ error: "Unauthorized" });
      return 
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);

      const result = await this.createWorkScheduleUseCase.execute({
        startTime,
        endTime,
        lateTolerance,
        breaksPerDay,
        days,
        requesterId: requester.id as string,
      });

      if(result.isLeft()) {
        const error = result.value;

        if(error instanceof NotFoundError) {
          return response.status(404).send({ error: error.message });
        }

        if(error instanceof DuplicatedError) {
          return response.status(400).send({ error: error.message });
        }

        if(error instanceof BadRequestError) {
          return response.status(400).send({ error: error.message });
        }
      }

      return response.status(201).send(result.value);
    } catch (error) {
      return response.status(400).send({ error: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  }
}