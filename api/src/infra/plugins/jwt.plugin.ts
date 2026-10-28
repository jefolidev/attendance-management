import { type FastifyPluginAsync, type FastifyRequest } from "fastify";
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: {
      [key: string]: string;
    };
  }

  interface FastifyReply {
    token: string | null
  }
}

export interface JwtPluginOptions {
  extractTokenFromCookieOrHeader: string 
}

const jwtPluginCallback: FastifyPluginAsync<JwtPluginOptions> = async (fastify, options) => {
  fastify.decorate("getTokenByCookieOrHeader", (request: FastifyRequest) => {
    const tokenFromCookie = request?.cookies?.['acess_token'];

    if(tokenFromCookie) 
      return tokenFromCookie

    const authHeader = request.headers.authorization

    if(authHeader && authHeader.startsWith("Bearer ")) 
      return authHeader.substring(7)

    return null
    
  }); 
}

export default fp(jwtPluginCallback);