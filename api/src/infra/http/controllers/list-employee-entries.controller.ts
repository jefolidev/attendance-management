import { NotFoundError } from "@src/core/entities/errors/not-found-error";
import type { ListEmployeeEntriesUseCase } from "@src/domain/manage/application/use-cases/list-employee-entries";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { presentEntriesAndStatisticsList } from "../presenters/entries-and-statistics.presenter";
import { z } from "zod";

export const listEmployeeEntriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
});

export class ListEmployeeEntriesController {
  constructor(
    private readonly listEmployeeEntriesUseCase: ListEmployeeEntriesUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, perPage } = listEmployeeEntriesQuerySchema.parse(request.query);
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.listEmployeeEntriesUseCase.execute({
        requesterId: requester.id as string,
        page,
        perPage,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message });
        }

        return reply.status(400).send({ error: error.message });
      }

      return reply.status(200).send({
        entries: presentEntriesAndStatisticsList(result.value.entries),
        pagination: result.value.pagination,
      });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
