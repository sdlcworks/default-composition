import type * as mongodbatlas from "@pulumi/mongodbatlas";
import type * as pulumi from "@pulumi/pulumi";
import type { MongodbatlasWorld } from "../providers/mongodbatlas";

export async function atlasProviderFromWorld(
  name: string,
  world: MongodbatlasWorld,
  opts?: pulumi.CustomResourceOptions,
): Promise<mongodbatlas.Provider> {
  const { Provider } = await import("@pulumi/mongodbatlas");
  return new Provider(name, {
    publicKey: world.MONGODB_ATLAS_PUBLIC_KEY,
    privateKey: world.MONGODB_ATLAS_PRIVATE_KEY,
  }, opts);
}
