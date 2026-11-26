import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";
import { mintGcpAccessToken } from "../../_internal/gcp-helpers";

const schema = z.object({
  GCP_PROJECT_ID: z.string().min(1),
  GCP_SERVICE_ACCOUNT_KEY: z.string().min(1),
  GCP_REGION: z.string().min(1).optional(),
}).passthrough();

export type GcloudWorld = z.infer<typeof schema>;

async function validate(world: GcloudWorld) {
  const token = await mintGcpAccessToken(world.GCP_SERVICE_ACCOUNT_KEY);
  const response = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${encodeURIComponent(world.GCP_PROJECT_ID)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) return { outcome: "refused" as const, reason: `gcloud-project-read-${response.status}` };
  return { outcome: "satisfied" as const };
}

const capabilities = {
  infrastructure: { description: "Creates and manages infrastructure in the selected Google Cloud project.", validate: ({ world }: { world: GcloudWorld }) => validate(world) },
  "registry-publish": { description: "Publishes artifacts to registries in the selected Google Cloud project.", validate: ({ world }: { world: GcloudWorld }) => validate(world) },
} satisfies ProviderCapabilityMap<GcloudWorld>;

export default defineProvider<"gcloud", typeof schema, GcloudWorld, typeof capabilities>({
  label: "gcloud",
  credentialRequirement: {
    schema,
    elements: {
      GCP_PROJECT_ID: { description: "Google Cloud project identifier.", required: true, confidential: false },
      GCP_SERVICE_ACCOUNT_KEY: { description: "Google Cloud service-account key JSON.", required: true, confidential: true },
      GCP_REGION: { description: "Optional default Google Cloud region.", required: false, confidential: false },
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
