-- CreateEnum
CREATE TYPE "DeploymentMode" AS ENUM ('template', 'custom');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('accepted', 'running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "mode" "DeploymentMode" NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'accepted',
    "submittedBy" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "resourceGroup" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "bicepOutput" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);
