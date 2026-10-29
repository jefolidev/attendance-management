import { type FastifyPluginAsync, type FastifyRequest } from "fastify";
import fp from 'fastify-plugin';

declare module "fastify" {
  interface FastifyInstance {
    jwtAuth:{ 
      encrypt: (request: Record<string, unknown>) => string;
      verifyToken: (token: string) => Record<string, unknown>;
      getTokenByCookieOrHeader: (request: FastifyRequest) => string | null;
    }
  }
}

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("jwtAuth", {
    
    getTokenByCookieOrHeader: (request: FastifyRequest): string | null => {
      const tokenFromCookie = request?.cookies?.['acess_token'];

      if(tokenFromCookie) 
        return tokenFromCookie

      const authHeader = request.headers.authorization

      if(authHeader && authHeader.startsWith("Bearer ")) 
        return authHeader.substring(7)

      return null
    },                                                   
    
    validate: (request: FastifyRequest, payload: string) => {
      try {
        const token = fastify.jwtAuth.getTokenByCookieOrHeader(request);

        if(!token) {
          throw new Error("Token not found");
        }
      }
      catch (error) {
        throw new Error("Invalid token");
      }
    },

    encrypt: (payload: Record<string, unknown>) => {
      return fastify.jwt.sign({
        payload
      });
    },

    verifyToken: (token: string) => {
      return fastify.jwt.verify(token);
    },

  }
)}

export default fp(jwtPlugin);