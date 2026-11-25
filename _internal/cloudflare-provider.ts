import type * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";
import type { CloudflareWorld } from "../providers/cloudflare";

export async function cloudflareProviderFromWorld(
  name: string,
  world: CloudflareWorld,
  opts?: pulumi.CustomResourceOptions,
): Promise<cloudflare.Provider> {
  const { Provider } = await import("@pulumi/cloudflare");
  return new Provider(
    name,
    { apiToken: world.CLOUDFLARE_API_TOKEN },
    opts,
  );
}
