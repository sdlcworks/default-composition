import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({}).passthrough();
export type LocalLinuxWorld = z.infer<typeof schema>;

const capabilities = {} satisfies ProviderCapabilityMap<LocalLinuxWorld>;

export default defineProvider<"local-linux", typeof schema, LocalLinuxWorld, typeof capabilities>({
  label: "local-linux",
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
