import "dotenv/config";
import { buildApp } from "./app.ts";

const app = buildApp();

try {
  await app.listen({
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? "0.0.0.0",
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}