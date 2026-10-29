import type { FastifyPluginAsync } from "fastify";
import createEmployeeRoute from "./employees/create-employee.routes";
import loginRoute from "./employees/login.routes";

const routes: FastifyPluginAsync = async (app) => {
  app.register(createEmployeeRoute);
  app.register(loginRoute);
}

export default routes
