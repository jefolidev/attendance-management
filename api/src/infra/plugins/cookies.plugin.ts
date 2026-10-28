import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const cookiesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("cookies", {
    setCookie: (
      name: string,
      value: string,
      options?: CookieSerializeOptions,
    ) => {
      fastify.log.info(`Setting cookie: ${name}`);
    },

    getCookie: (name: string) => {
      fastify.log.info(`Getting cookie: ${name}`);
    },

    clearCookie: (
      name: string,
      options?: CookieSerializeOptions,
    ) => {
      fastify.log.info(`Clearing cookie: ${name}`);
    },
  });
};

export default fp(cookiesPlugin, {
  name: "cookies-plugin",
  dependencies: ["jwt-plugin"],
});