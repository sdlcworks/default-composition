import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({}).passthrough();
export type E2bLocalWorld = z.infer<typeof schema>;

const capabilities = {} satisfies ProviderCapabilityMap<E2bLocalWorld>;

export default defineProvider<"e2b-local", typeof schema, E2bLocalWorld, typeof capabilities>({
  label: "e2b-local",
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
