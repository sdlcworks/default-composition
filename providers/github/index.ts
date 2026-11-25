import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

const schema = z.object({ GH_TOKEN: z.string().min(1) }).passthrough();
export type GithubWorld = z.infer<typeof schema>;

const capabilities = { "release-publish": { description: "Publishes release artifacts to GitHub Releases.", validate: async ({ world }: { world: GithubWorld }) => {
    const response = await fetch("https://api.github.com/user", { headers: { authorization: `Bearer ${world.GH_TOKEN}`, "user-agent": "sdlcworks" } });
    return response.ok ? { outcome: "satisfied" } : { outcome: "refused", reason: `github-token-verify-${response.status}` };
  } } } satisfies ProviderCapabilityMap<GithubWorld>;

export default defineProvider<"github", typeof schema, GithubWorld, typeof capabilities>({
  label: "github",
  credentialRequirement: { schema, elements: { GH_TOKEN: { description: "GitHub token authorized to publish releases.", required: true, confidential: true } } },
  initialize: async (material) =>
    ({ outcome: "initialized", world: schema.parse(material) }),
  capabilities,
});
