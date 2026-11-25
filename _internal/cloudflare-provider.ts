import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";
import type { CloudflareWorld } from "../providers/cloudflare";

export function cloudflareProviderFromWorld(
  name: string,
  world: CloudflareWorld,
  opts?: pulumi.CustomResourceOptions,
): cloudflare.Provider {
  return new cloudflare.Provider(
    name,
    { apiToken: world.CLOUDFLARE_API_TOKEN },
    opts,
  );
}
