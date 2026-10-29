import { type FastifyPluginAsync } from "fastify";
import fp from 'fastify-plugin';

declare module "fastify" {
  interface FastifyInstance {
    encrypt: (request: FastifyRequest) => string;
    verifyToken: (request: FastifyRequest) => Promise<void>;
  }
}

const cryptographyPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate("cryptography", {
      
    encrypt: (payload: Record<string, unknown>) => {
      return fastify.jwt.sign({
        payload
      });
    },

    verifyToken:  (token: string) => {
      return fastify.jwt.verify(token);
    }
  });
};

export default fp(cryptographyPlugin);