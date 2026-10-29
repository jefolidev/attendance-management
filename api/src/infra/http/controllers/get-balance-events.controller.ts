import type { GetBalanceEventsUseCase } from "@src/domain/manage/application/use-cases/get-balance-events";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { WORK_SCHEDULE_TIMEZONE } from "@src/core/time/work-schedule-timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class GetBalanceEventsController {
  constructor(
    private readonly getBalanceEventsUseCase: GetBalanceEventsUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.getBalanceEventsUseCase.execute({
        requesterId: requester.id as string,
      });

      if (result.isLeft()) {
        return reply.status(404).send({ error: result.value.message });
      }

      return reply.status(200).send({
        events: result.value.events.map((event) => ({
          employeeId: event.employeeId.toString(),
          timeBalanceId: event.timeBalanceId.toString(),
          type: event.type,
          reason: event.reason,
          durationInMinutes: event.durationInMinutes,
          createdAt: dayjs(event.createdAt)
            .tz(WORK_SCHEDULE_TIMEZONE)
            .format(),
        })),
      });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
