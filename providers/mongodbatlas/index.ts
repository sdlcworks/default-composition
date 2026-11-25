import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({
  MONGODB_ATLAS_PUBLIC_KEY: z.string().min(1),
  MONGODB_ATLAS_PRIVATE_KEY: z.string().min(1),
  MONGODB_ATLAS_ORG_ID: z.string().min(1).optional(),
}).passthrough();

export type MongodbatlasWorld = z.infer<typeof schema>;

async function validate(_world: MongodbatlasWorld) {
  return {
    outcome: "unable-to-answer" as const,
    detail: "digest-auth-unportable",
  };
}

const capabilities = {
  "database-provisioning": {
    description: "Creates and manages MongoDB Atlas projects, clusters, and database users.",
    validate: ({ world }: { world: MongodbatlasWorld }) => validate(world),
  },
} satisfies ProviderCapabilityMap<MongodbatlasWorld>;

export default defineProvider<"mongodbatlas", typeof schema, MongodbatlasWorld, typeof capabilities>({
  label: "mongodbatlas",
  credentialRequirement: {
    schema,
    elements: {
      MONGODB_ATLAS_PUBLIC_KEY: { description: "MongoDB Atlas public API key.", required: true, confidential: false },
      MONGODB_ATLAS_PRIVATE_KEY: { description: "MongoDB Atlas private API key.", required: true, confidential: true },
      MONGODB_ATLAS_ORG_ID: { description: "Optional MongoDB Atlas organization identifier used when creating a project.", required: false, confidential: false },
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
