import type * as gcp from "@pulumi/gcp";
import type * as pulumi from "@pulumi/pulumi";
import type { GcloudWorld } from "../providers/gcloud";

export async function gcloudProviderFromWorld(
  name: string,
  world: GcloudWorld,
  opts?: pulumi.CustomResourceOptions,
): Promise<gcp.Provider> {
  const { Provider } = await import("@pulumi/gcp");
  return new Provider(name, {
    project: world.GCP_PROJECT_ID,
    credentials: world.GCP_SERVICE_ACCOUNT_KEY,
    region: world.GCP_REGION,
  }, opts);
}
