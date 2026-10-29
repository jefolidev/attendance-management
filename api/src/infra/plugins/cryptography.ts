import { type FastifyPluginAsync } from "fastify";
import fp from 'fastify-plugin';

declare module "fastify" {
  interface FastifyInstance {
    bcrypt: {
      hash: (password: string) => Promise<string>;
      compare: (password: string, hashedPassword: string) => Promise<boolean>;
    }
  }
}

const cryptographyPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate("cryptography", {

    hash: (password: string) => {
      return fastify.bcrypt.hash(password);
    },

    compare: (password: string, hashedPassword: string) => {
      return fastify.bcrypt.compare(password, hashedPassword);
    }
  });
};

export default fp(cryptographyPlugin);