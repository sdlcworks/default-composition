import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";
import type { AwsWorld } from "../providers/aws";

export function awsProviderFromWorld(
  name: string,
  world: AwsWorld,
  opts?: pulumi.CustomResourceOptions,
): aws.Provider {
  return new aws.Provider(name, {
    accessKey: world.AWS_ACCESS_KEY_ID,
    secretKey: world.AWS_SECRET_ACCESS_KEY,
    token: world.AWS_SESSION_TOKEN,
    region: world.AWS_REGION,
  }, opts);
}
