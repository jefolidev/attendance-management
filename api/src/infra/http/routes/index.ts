import type { FastifyPluginAsync } from "fastify";
import createEmployeeRoute from "./employees/create-employee.routes";
import createWorkScheduleRoute from "./employees/create-work-schedule.routes";
import getAccumulatedDelayTimeRoute from "./employees/get-accumulated-delay-time.routes";
import getWorkScheduleRoute from "./employees/get-work-schedule.routes";
import listEmployeeEntriesRoute from "./employees/list-employee-entries.routes";
import loginRoute from "./employees/login.routes";
import registerBreakEntryRoute from "./employees/register-break-entry.routes";
import updateWorkScheduleRoute from "./employees/update-work-schedule.routes";

const routes: FastifyPluginAsync = async (app) => {
  app.register(createEmployeeRoute);
  app.register(createWorkScheduleRoute);
  app.register(getAccumulatedDelayTimeRoute);
  app.register(getWorkScheduleRoute);
  app.register(listEmployeeEntriesRoute);
  app.register(loginRoute);
  app.register(registerBreakEntryRoute);
  app.register(updateWorkScheduleRoute);
}

export default routes
