import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({}).passthrough();
export type LocalMacosWorld = z.infer<typeof schema>;

const capabilities = {} satisfies ProviderCapabilityMap<LocalMacosWorld>;

export default defineProvider<"local-macos", typeof schema, LocalMacosWorld, typeof capabilities>({
  label: "local-macos",
  credentialRequirement: { schema, elements: {} },
  initialize: async (material) => {
    const parsed = schema.safeParse(material);
    if (!parsed.success) {
      return { outcome: "refused", reason: "credential-material-nonconforming" };
    }
    return { outcome: "initialized", world: parsed.data };
  },
  capabilities,
});
