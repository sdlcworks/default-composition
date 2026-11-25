import * as mongodbatlas from "@pulumi/mongodbatlas";
import type * as pulumi from "@pulumi/pulumi";
import type { MongodbatlasWorld } from "../providers/mongodbatlas";

export function atlasProviderFromWorld(
  name: string,
  world: MongodbatlasWorld,
  opts?: pulumi.CustomResourceOptions,
): mongodbatlas.Provider {
  return new mongodbatlas.Provider(name, {
    publicKey: world.MONGODB_ATLAS_PUBLIC_KEY,
    privateKey: world.MONGODB_ATLAS_PRIVATE_KEY,
  }, opts);
}
