import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({ NPM_TOKEN: z.string().min(1) }).passthrough();
export type NpmWorld = z.infer<typeof schema>;

const capabilities = { "package-publish": { description: "Publishes packages to the public npm registry.", validate: async ({ world }: { world: NpmWorld }) => {
    const response = await fetch("https://registry.npmjs.org/-/whoami", { headers: { authorization: `Bearer ${world.NPM_TOKEN}` } });
    return response.ok ? { outcome: "satisfied" } : { outcome: "refused", reason: `npm-token-verify-${response.status}` };
  } } } satisfies ProviderCapabilityMap<NpmWorld>;

export default defineProvider<"npm", typeof schema, NpmWorld, typeof capabilities>({
  label: "npm",
  credentialRequirement: { schema, elements: { NPM_TOKEN: { description: "npm registry authentication token.", required: true, confidential: true } } },
  initialize: async (material) => {
    const parsed = schema.safeParse(material);
    if (!parsed.success) {
      return { outcome: "refused", reason: "credential-material-nonconforming" };
    }
    return { outcome: "initialized", world: parsed.data };
  },
  capabilities,
});
