import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({
  CLOUDFLARE_API_TOKEN: z.string().min(1),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
}).passthrough();

export type CloudflareWorld = z.infer<typeof schema>;

async function validate(world: CloudflareWorld) {
  const response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    headers: { authorization: `Bearer ${world.CLOUDFLARE_API_TOKEN}` },
  });
  if (!response.ok) return { outcome: "refused" as const, reason: `cloudflare-token-verify-${response.status}` };
  return { outcome: "satisfied" as const };
}

const capabilities = {
  "name-registration": { description: "Registers public names and routes in Cloudflare.", validate: ({ world }: { world: CloudflareWorld }) => validate(world) },
  workers: { description: "Creates and updates Cloudflare Workers and their routes.", validate: ({ world }: { world: CloudflareWorld }) => validate(world) },
  "object-store": { description: "Creates and manages Cloudflare object storage.", validate: ({ world }: { world: CloudflareWorld }) => validate(world) },
  "d1-database": { description: "Creates and manages Cloudflare D1 databases.", validate: ({ world }: { world: CloudflareWorld }) => validate(world) },
} satisfies ProviderCapabilityMap<CloudflareWorld>;

export default defineProvider<"cloudflare", typeof schema, CloudflareWorld, typeof capabilities>({
  label: "cloudflare",
  credentialRequirement: {
    schema,
    elements: {
      CLOUDFLARE_API_TOKEN: { description: "Cloudflare API token.", required: true, confidential: true },
      CLOUDFLARE_ACCOUNT_ID: { description: "Cloudflare account identifier.", required: true, confidential: false },
    },
  },
  initialize: async (material) =>
    ({ outcome: "initialized", world: schema.parse(material) }),
  capabilities,
});
