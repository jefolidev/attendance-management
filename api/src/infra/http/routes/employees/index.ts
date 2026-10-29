import type { FastifyPluginAsync } from "fastify";
import createEmployeeRoute from "./create-employee.routes";

const routes: FastifyPluginAsync = async (app) => {
  app.register(createEmployeeRoute);
}

export default routes