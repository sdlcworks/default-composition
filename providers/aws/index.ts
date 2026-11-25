import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_SESSION_TOKEN: z.string().min(1).optional(),
  AWS_REGION: z.string().min(1),
}).passthrough();

export type AwsWorld = z.infer<typeof schema>;

async function validate(world: AwsWorld) {
  const client = new STSClient({
    region: world.AWS_REGION,
    credentials: {
      accessKeyId: world.AWS_ACCESS_KEY_ID,
      secretAccessKey: world.AWS_SECRET_ACCESS_KEY,
      sessionToken: world.AWS_SESSION_TOKEN,
    },
  });
  await client.send(new GetCallerIdentityCommand({}));
  return { outcome: "satisfied" as const };
}

const capabilities = {
  infrastructure: { description: "Creates and manages infrastructure in the selected AWS account and region.", validate: ({ world }: { world: AwsWorld }) => validate(world) },
  "registry-publish": { description: "Publishes artifacts to registries in the selected AWS account and region.", validate: ({ world }: { world: AwsWorld }) => validate(world) },
} satisfies ProviderCapabilityMap<AwsWorld>;

export default defineProvider<"aws", typeof schema, AwsWorld, typeof capabilities>({
  label: "aws",
  credentialRequirement: {
    schema,
    elements: {
      AWS_ACCESS_KEY_ID: { description: "AWS access-key identifier.", required: true, confidential: true },
      AWS_SECRET_ACCESS_KEY: { description: "AWS secret access key.", required: true, confidential: true },
      AWS_SESSION_TOKEN: { description: "Optional AWS session token.", required: false, confidential: true },
      AWS_REGION: { description: "AWS region in which infrastructure is managed.", required: true, confidential: false },
    },
  },
  initialize: async (material) => {
    const parsed = schema.safeParse(material);
    if (!parsed.success) {
      return { outcome: "refused", reason: "credential-material-nonconforming" };
    }
    return { outcome: "initialized", world: parsed.data };
  },
  capabilities,
});
