import env from "./lib/env.js";
import { createApp } from "./app.js";
import db from "./lib/db.js";

const fastify = await createApp();

const shutdown = async (signal: string) => {
  fastify.log.info({ signal }, "Received shutdown signal, closing server...");
  try {
    await fastify.close();
    await db.$disconnect();
    fastify.log.info("Server closed cleanly");
    process.exit(0);
  } catch (err) {
    fastify.log.error({ err }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

try {
  await fastify.listen({ port: parseInt(env.PORT, 10), host: "0.0.0.0" });
} catch (err) {
  fastify.log.error({ err }, "Failed to start server");
  process.exit(1);
}
