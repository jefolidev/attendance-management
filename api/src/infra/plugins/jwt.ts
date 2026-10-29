import { type FastifyPluginAsync, type FastifyRequest } from "fastify";
import fp from 'fastify-plugin';

declare module "fastify" {
  interface FastifyInstance {
    getTokenByCookieOrHeader: (request: FastifyRequest) => string;
    verifyToken: (request: FastifyRequest) => Promise<void>;
  }
}

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("jwtAuth", {
    
    getTokenByCookieOrHeader: (request: FastifyRequest) => {
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
        const token = fastify.getTokenByCookieOrHeader(request);

        if(!token) {
          throw new Error("Token not found");
        }
      }
      catch (error) {
        throw new Error("Invalid token");
      }
    }
  }
)}

export default fp(jwtPlugin);