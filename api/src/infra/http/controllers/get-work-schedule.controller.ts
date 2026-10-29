import type { GetWorkScheduleUseCase } from "@src/domain/manage/application/use-cases/get-work-schedule";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { presentWorkSchedule } from "../presenters/work-schedule.presenter";

export class GetWorkScheduleController {
  constructor(
    private readonly getWorkScheduleUseCase: GetWorkScheduleUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.getWorkScheduleUseCase.execute({
        requesterId: requester.id as string,
      });

      if (result.isLeft()) {
        return reply.status(404).send({ error: result.value.message });
      }

      return reply.status(200).send(presentWorkSchedule(result.value));
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
