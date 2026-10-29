import type { Encrypter } from "@src/domain/manage/application/cryptograhpy/encrypter";
import type { FastifyInstance } from "fastify";

export class JwtEncrypter implements Encrypter {
  constructor(private readonly fastify: FastifyInstance) {}

  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return this.fastify.jwt.sign(payload);
  }
}
