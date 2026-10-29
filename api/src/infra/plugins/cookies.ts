import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    setCookies: (reply: FastifyReply, name: string, value: string, options?: CookieSerializeOptions) => void;
    getCookies: (request: FastifyRequest, name: string) => Promise<void>;
    clearCookies: (reply: FastifyReply, name: string, options?: CookieSerializeOptions) => Promise<void>;
  }
}

const cookiesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("cookies", {
    setCookie: (
      reply: FastifyReply,
      name: string,
      value: string,
      options?: CookieSerializeOptions,
    ) => {
      reply.setCookie(name, value, options);
    },

    getCookie: (request: FastifyRequest, name: string) => {
      return request.cookies[name];
    },

    clearCookie: (
      reply: FastifyReply,
      name: string,
      options?: CookieSerializeOptions,
    ) => {
      reply.clearCookie(name, options);
    },
  });
};

export default fp(cookiesPlugin);