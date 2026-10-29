import "dotenv/config";
import { buildApp } from "./app.ts";

const app = buildApp();

try {
  await app.listen({
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? "0.0.0.0",
  });

  console.log(`🔥 Server is running on http://${process.env.HOST ?? "0.0.0.0"}:${process.env.PORT ?? 3000}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}