import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import env from "./lib/env.js";
import { AppError, errorResponse } from "./lib/errors.js";
import healthRoutes from "./routes/health.js";
import deploymentsRoutes from "./routes/deployments.js";

export async function createApp() {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
              },
            },
          }
        : {
            formatters: {
              level(label: string) {
                return { level: label };
              },
            },
            timestamp: () =>
              `,"time":"${new Date().toISOString()}"`,
          }),
    },
    bodyLimit: parseInt(env.BODY_LIMIT_BYTES, 10),
    requestIdHeader: "x-request-id",
    genReqId: () => crypto.randomUUID(),
  });

  // CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Global error handler
  fastify.setErrorHandler((err, req, reply) => {
    const requestId = req.id as string;

    if (err instanceof AppError) {
      req.log.warn({ err, requestId }, "Application error");
      return reply
        .status(err.statusCode)
        .send(errorResponse(err, requestId));
    }

    // Fastify validation errors (schema mismatch)
    const fastifyErr = err as { validation?: unknown };
    if (Array.isArray(fastifyErr.validation)) {
      const details = (
        fastifyErr.validation as Array<{
          instancePath?: string;
          message?: string;
        }>
      ).map((v) => ({
        path: v.instancePath?.replace(/^\//, "") ?? "unknown",
        message: v.message ?? "Invalid value",
      }));
      const appErr = AppError.validation("Request validation failed", details);
      req.log.warn({ err, requestId }, "Validation error");
      return reply
        .status(400)
        .send(errorResponse(appErr, requestId));
    }

    // Unexpected errors — do not leak internals
    console.error("[UNHANDLED ERROR]", err);
    req.log.error({ err, requestId }, "Unhandled error");
    const internalErr = AppError.internal();
    return reply
      .status(500)
      .send(errorResponse(internalErr, requestId));
  });

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(deploymentsRoutes, { prefix: "/deployments" });

  // Serve frontend static files if the public directory exists
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(__dirname, "..", "public");
  if (existsSync(publicDir)) {
    await fastify.register(fastifyStatic, {
      root: publicDir,
      prefix: "/",
      index: ["index.html"],
      wildcard: false,
    });
    // Catch-all: serve index.html for unknown routes (client-side routing)
    fastify.setNotFoundHandler((_req, reply) => {
      reply.sendFile("index.html");
    });
  }

  return fastify;
}
