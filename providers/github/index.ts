import { defineProvider } from "@sdlcworks/components";
import type { ProviderCapabilityMap } from "@sdlcworks/providers";
import { z } from "zod";

export const GITHUB_API_BASE_URL = "https://api.github.com/";
const ADMIN_ORG_SCOPE = "admin:org";

const schema = z.object({ GH_TOKEN: z.string().min(1) }).passthrough();
export type GithubWorld = z.infer<typeof schema>;
export type GitHubWorld = GithubWorld;

async function probeUser(world: GithubWorld): Promise<Response> {
  return fetch(new URL("user", GITHUB_API_BASE_URL), {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${world.GH_TOKEN}`,
      "user-agent": "sdlcworks",
      "x-github-api-version": "2022-11-28",
    },
  });
}

async function validateOrganizationAdministration(world: GithubWorld) {
  const response = await probeUser(world);
  if (!response.ok) {
    return {
      outcome: "refused" as const,
      reason: `github-token-verify-${response.status}`,
    };
  }
  const scopes = (response.headers.get("x-oauth-scopes") ?? "")
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
  return scopes.includes(ADMIN_ORG_SCOPE)
    ? { outcome: "satisfied" as const }
    : {
        outcome: "refused" as const,
        reason: "github-admin-org-scope-required",
      };
}

const capabilities = {
  "release-publish": {
    description: "Publishes release artifacts to GitHub Releases.",
    validate: async ({ world }: { world: GithubWorld }) => {
      const response = await probeUser(world);
      return response.ok
        ? { outcome: "satisfied" }
        : { outcome: "refused", reason: `github-token-verify-${response.status}` };
    },
  },
  "organization-settings": {
    description: "Manage the declared settings of a GitHub organization",
    validate: ({ world }: { world: GithubWorld }) =>
      validateOrganizationAdministration(world),
  },
  "organization-membership-invitations": {
    description: "Invite, administer, and remove GitHub organization members",
    validate: ({ world }: { world: GithubWorld }) =>
      validateOrganizationAdministration(world),
  },
} satisfies ProviderCapabilityMap<GithubWorld>;

export default defineProvider<"github", typeof schema, GithubWorld, typeof capabilities>({
  label: "github",
  credentialRequirement: {
    schema,
    elements: {
      GH_TOKEN: {
        description:
          "GitHub token; release publication needs repo access, organization stewardship needs admin:org scope.",
        required: true,
        confidential: true,
      },
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
