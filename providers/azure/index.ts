import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({ AZURE_DEVOPS_ORG: z.string().min(1), AZURE_DEVOPS_PAT: z.string().min(1) }).passthrough();
export type AzureWorld = z.infer<typeof schema>;

const capabilities = { "package-publish": { description: "Publishes packages to Azure DevOps Artifacts.", validate: async ({ world }: { world: AzureWorld }) => {
    const authorization = btoa(Array.from(
      new TextEncoder().encode(`:${world.AZURE_DEVOPS_PAT}`),
      (byte) => String.fromCharCode(byte),
    ).join(""));
    const response = await fetch(`https://dev.azure.com/${encodeURIComponent(world.AZURE_DEVOPS_ORG)}/_apis/projects?api-version=7.1&$top=1`, { headers: { authorization: `Basic ${authorization}` } });
    return response.ok ? { outcome: "satisfied" } : { outcome: "refused", reason: `azure-devops-auth-${response.status}` };
  } } } satisfies ProviderCapabilityMap<AzureWorld>;

export default defineProvider<"azure", typeof schema, AzureWorld, typeof capabilities>({
  label: "azure",
  credentialRequirement: { schema, elements: {
    AZURE_DEVOPS_ORG: { description: "Azure DevOps organization name.", required: true, confidential: false },
    AZURE_DEVOPS_PAT: { description: "Azure DevOps personal access token.", required: true, confidential: true },
  } },
  initialize: async (material) => {
    const parsed = schema.safeParse(material);
    if (!parsed.success) {
      return { outcome: "refused", reason: "credential-material-nonconforming" };
    }
    return { outcome: "initialized", world: parsed.data };
  },
  capabilities,
});
