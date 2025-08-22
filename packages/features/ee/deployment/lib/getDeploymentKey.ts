import { symmetricDecrypt } from "@calcom/lib/crypto";
import logger from "@calcom/lib/logger";
import type { IDeploymentRepository } from "@calcom/lib/server/repository/deployment.interface";

const log = logger.getSubLogger({ prefix: ["getDeploymentKey"] });

export async function getDeploymentKey(deploymentRepo: IDeploymentRepository): Promise<string> {
  if (process.env.CALCOM_LICENSE_KEY) {
    return process.env.CALCOM_LICENSE_KEY;
  }
  const licenseKey = await deploymentRepo.getLicenseKeyWithId(1);
  return licenseKey || "";
}

export async function getDeploymentSignatureToken(
  deploymentRepo: IDeploymentRepository
): Promise<string | null> {
  if (process.env.CAL_SIGNATURE_TOKEN) {
    return process.env.CAL_SIGNATURE_TOKEN;
  }
  // If CAL_SIGNATURE_TOKEN is not set, we return null to bypass the database lookup and error.
  return null;
}
