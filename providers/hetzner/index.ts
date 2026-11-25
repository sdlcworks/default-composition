import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({ HCLOUD_TOKEN: z.string().min(1) }).passthrough();
export type HetznerWorld = z.infer<typeof schema>;

const capabilities = { infrastructure: { description: "Creates and manages infrastructure in Hetzner Cloud.", validate: async ({ world }: { world: HetznerWorld }) => {
    const response = await fetch("https://api.hetzner.cloud/v1/servers?per_page=1", { headers: { authorization: `Bearer ${world.HCLOUD_TOKEN}` } });
    return response.ok ? { outcome: "satisfied" } : { outcome: "refused", reason: `hetzner-token-verify-${response.status}` };
  } } } satisfies ProviderCapabilityMap<HetznerWorld>;

export default defineProvider<"hetzner", typeof schema, HetznerWorld, typeof capabilities>({
  label: "hetzner",
  credentialRequirement: { schema, elements: { HCLOUD_TOKEN: { description: "Hetzner Cloud API token.", required: true, confidential: true } } },
  initialize: async (material) => {
    const parsed = schema.safeParse(material);
    if (!parsed.success) {
      return { outcome: "refused", reason: "credential-material-nonconforming" };
    }
    return { outcome: "initialized", world: parsed.data };
  },
  capabilities,
});
