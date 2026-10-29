import type { FastifyPluginAsync } from "fastify";
import createEmployeeRoute from "./employees/create-employee.routes";
import createWorkScheduleRoute from "./employees/create-work-schedule.routes";
import getWorkScheduleRoute from "./employees/get-work-schedule.routes";
import loginRoute from "./employees/login.routes";
import updateWorkScheduleRoute from "./employees/update-work-schedule.routes";

const routes: FastifyPluginAsync = async (app) => {
  app.register(createEmployeeRoute);
  app.register(createWorkScheduleRoute);
  app.register(getWorkScheduleRoute);
  app.register(loginRoute);
  app.register(updateWorkScheduleRoute);
}

export default routes
