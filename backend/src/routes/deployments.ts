import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../lib/errors.js";
import env from "../lib/env.js";
import { deploymentPayloadSchema } from "../modules/deployments/deployment.schema.js";
import {
  submitDeployment,
  getDeployment,
} from "../modules/deployments/deployment.service.js";

const deploymentsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/", async (req, reply) => {
    const parseResult = deploymentPayloadSchema.safeParse(req.body);

    if (!parseResult.success) {
      throw AppError.validation(
        "Request validation failed",
        parseResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      );
    }

    const result = await submitDeployment(parseResult.data);

    return reply.status(201).send(result);
  });

  fastify.get<{ Params: { submissionId: string } }>(
    "/:submissionId",
    async (req, reply) => {
      if (!env.ENABLE_GET_DEPLOYMENT) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Not found" },
          requestId: req.id,
        });
      }

      const deployment = await getDeployment(req.params.submissionId);

      return reply.status(200).send({
        submissionId: deployment.id,
        mode: deployment.mode,
        status: deployment.status,
        payload: deployment.payload,
        errorMessage: deployment.errorMessage ?? null,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
      });
    }
  );
};

export default deploymentsRoutes;
