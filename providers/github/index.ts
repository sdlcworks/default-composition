import { defineProvider } from "@sdlcworks/components";
import { z } from "zod";

const ADMIN_ORG_SCOPE = "admin:org";

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  return url.href.endsWith("/") ? url.href : `${url.href}/`;
}

function validateOrganizationAdministration(world: GitHubWorld) {
  return Promise.resolve(
    world.scopes.includes(ADMIN_ORG_SCOPE)
      ? { outcome: "satisfied" as const }
      : {
          outcome: "refused" as const,
          reason: "github-admin-org-scope-required",
        },
  );
}

export type GitHubWorld = {
  token: string;
  baseUrl: string;
  scopes: readonly string[];
};

const declaration = defineProvider({
  label: "github",
  credentialRequirement: {
    schema: z.object({
      token: z.string().min(1),
      baseUrl: z.url().default("https://api.github.com/"),
    }),
    elements: {
      token: {
        description: "Classic GitHub token with admin:org scope",
        required: true,
        confidential: true,
      },
      baseUrl: {
        description: "GitHub REST API base URL",
        required: false,
        confidential: false,
      },
    },
  },
  initialize: async (material) => {
    const baseUrl = normalizeBaseUrl(material.baseUrl);
    let response: Response;
    try {
      response = await fetch(new URL("user", baseUrl), {
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${material.token}`,
          "x-github-api-version": "2022-11-28",
        },
      });
    } catch (error) {
      return { outcome: "unable-to-answer", detail: String(error) };
    }
    if (response.status === 401 || response.status === 403) {
      return { outcome: "refused", reason: "github-credentials-refused" };
    }
    if (!response.ok) {
      return {
        outcome: "unable-to-answer",
        detail: `github credential probe returned ${response.status}`,
      };
    }
    const scopes = (response.headers.get("x-oauth-scopes") ?? "")
      .split(",")
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0)
      .sort();
    return {
      outcome: "initialized",
      world: { token: material.token, baseUrl, scopes },
    };
  },
  capabilities: {
    "organization-settings": {
      description: "Manage the declared settings of a GitHub organization",
      validate: ({ world }) => validateOrganizationAdministration(world as GitHubWorld),
    },
    "organization-membership-invitations": {
      description: "Invite, administer, and remove GitHub organization members",
      validate: ({ world }) => validateOrganizationAdministration(world as GitHubWorld),
    },
  },
});

export default declaration;
