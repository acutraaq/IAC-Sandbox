import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Reuse singleton across hot-reloads in development (tsx watch)
if (globalThis.__prisma) {
  prisma = globalThis.__prisma;
} else {
  prisma = new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "warn", emit: "stdout" },
      { level: "error", emit: "stdout" },
    ],
  });
  globalThis.__prisma = prisma;
}

export default prisma;
