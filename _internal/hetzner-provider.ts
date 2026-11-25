import type * as hcloud from "@pulumi/hcloud";
import type * as pulumi from "@pulumi/pulumi";
import type { HetznerWorld } from "../providers/hetzner";

export async function hetznerProviderFromWorld(
  name: string,
  world: HetznerWorld,
  opts?: pulumi.CustomResourceOptions,
): Promise<hcloud.Provider> {
  const { Provider } = await import("@pulumi/hcloud");
  return new Provider(name, { token: world.HCLOUD_TOKEN }, opts);
}
