import type { AuthenticateEmployeeUseCase } from "@src/domain/manage/application/use-cases/authenticate-employee";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const loginBodySchema = z.object({
  username: z.string().min(2).max(100),
  password: z.string().min(1).max(100),
});

export class LoginController {
  constructor(
    private readonly authenticateEmployeeUseCase: AuthenticateEmployeeUseCase,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { username, password } = loginBodySchema.parse(request.body);

    const result = await this.authenticateEmployeeUseCase.execute({
      username,
      password,
    });

    if (result.isLeft()) {
      return reply.status(401).send({ error: result.value.message });
    }

    const { accessToken, employee } = result.value;

    reply.setCookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return reply.status(200).send({ accessToken, employee });
  }
}
