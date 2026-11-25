import * as hcloud from "@pulumi/hcloud";
import type * as pulumi from "@pulumi/pulumi";
import type { HetznerWorld } from "../providers/hetzner";

export function hetznerProviderFromWorld(
  name: string,
  world: HetznerWorld,
  opts?: pulumi.CustomResourceOptions,
): hcloud.Provider {
  return new hcloud.Provider(name, { token: world.HCLOUD_TOKEN }, opts);
}
