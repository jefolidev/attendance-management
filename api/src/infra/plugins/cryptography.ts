import { type FastifyPluginAsync } from "fastify";
import fp from 'fastify-plugin';
import { BcryptHasher } from "../cryptography/bcrypt-hasher.ts";

declare module "fastify" {
  interface FastifyInstance {
    cryptography: {
      hash: (password: string) => Promise<string>;
      compare: (password: string, hashedPassword: string) => Promise<boolean>;
    }
  }
}

const cryptographyPlugin: FastifyPluginAsync = async (fastify) => {
  const hasher = new BcryptHasher();

  fastify.decorate("cryptography", {
    hash: (password: string) => {
      return hasher.hash(password);
    },

    compare: (password: string, hashedPassword: string) => {
      return hasher.compare(password, hashedPassword);
    }
  });
};

export default fp(cryptographyPlugin);
