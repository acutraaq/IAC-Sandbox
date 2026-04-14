import pino from "pino";
import env from "./env.js";

const logger = pino(
  env.NODE_ENV === "development"
    ? {
        level: env.LOG_LEVEL,
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
        level: env.LOG_LEVEL,
        formatters: {
          level(label: string) {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
);

export default logger;
