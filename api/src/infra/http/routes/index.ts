import type { FastifyPluginAsync } from "fastify";
import createEmployeeRoute from "./employees/create-employee.routes";
import createWorkScheduleRoute from "./employees/create-work-schedule.routes";
import getAccumulatedDelayTimeRoute from "./employees/get-accumulated-delay-time.routes";
import getBalanceEventsRoute from "./employees/get-balance-events.routes";
import getBalanceRoute from "./employees/get-balance.routes";
import getWorkScheduleRoute from "./employees/get-work-schedule.routes";
import listEmployeeEntriesRoute from "./employees/list-employee-entries.routes";
import loginRoute from "./employees/login.routes";
import registerBreakEntryRoute from "./employees/register-break-entry.routes";
import registerTimeInEntryRoute from "./employees/register-time-in-entry.routes";
import registerTimeOutEntryRoute from "./employees/register-time-out-entry.routes";
import updateWorkScheduleRoute from "./employees/update-work-schedule.routes";

const routes: FastifyPluginAsync = async (app) => {
  app.register(createEmployeeRoute);
  app.register(createWorkScheduleRoute);
  app.register(getAccumulatedDelayTimeRoute);
  app.register(getBalanceEventsRoute);
  app.register(getBalanceRoute);
  app.register(getWorkScheduleRoute);
  app.register(listEmployeeEntriesRoute);
  app.register(loginRoute);
  app.register(registerBreakEntryRoute);
  app.register(registerTimeInEntryRoute);
  app.register(registerTimeOutEntryRoute);
  app.register(updateWorkScheduleRoute);
}

export default routes
