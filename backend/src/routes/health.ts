import type { FastifyPluginAsync } from "fastify";
import db from "../lib/db.js";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/healthz", async (_req, reply) => {
    return reply.status(200).send({ status: "ok" });
  });

  fastify.get("/readyz", async (_req, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return reply.status(200).send({ status: "ok" });
    } catch {
      return reply
        .status(503)
        .send({ status: "degraded", reason: "database unreachable" });
    }
  });
};

export default healthRoutes;
