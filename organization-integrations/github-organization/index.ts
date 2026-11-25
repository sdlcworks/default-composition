import * as github from "@pulumi/github";
import * as pulumi from "@pulumi/pulumi";
import { OrganizationIntegration } from "@sdlcworks/components";
import { z } from "zod";
import declaration, { type GitHubWorld } from "../../providers/github/index.ts";

const integration = new OrganizationIntegration({
  metadata: {
    category: "code-host",
    external_container: "organization",
    member_allocation: "invitation-backed-membership",
  },
  configurationSchema: z.object({
    organizationLogin: z.string().min(1),
    billingEmail: z.email(),
    displayName: z.string().min(1),
  }),
  memberAllocationSchema: z.object({
    username: z.string().min(1),
    role: z.enum(["member", "admin"]).default("member"),
  }),
  outputSchema: z.object({
    externalOrganizationLogin: z.string(),
    externalOrganizationId: z.string(),
    externalPrincipalLogin: z.string().nullable(),
    externalMembershipId: z.string().nullable(),
  }),
});

function githubProvider(
  name: string,
  organizationLogin: pulumi.Input<string>,
  world: GitHubWorld,
) {
  return new github.Provider(name, {
    token: pulumi.secret(world.token),
    owner: organizationLogin,
    baseUrl: world.baseUrl,
  });
}

integration.implement(
  declaration,
  {
    stateSchema: z.object({
      organizationLogin: z.string(),
      organizationSettingsId: z.string(),
    }),
    provision: async ({ $, configuration, state, provider }) => {
      const owner = pulumi.output(configuration.organizationLogin);
      const githubWorld = githubProvider($`provider`, owner, provider);
      const settings = new github.OrganizationSettings(
        $`organization-settings`,
        {
          billingEmail: configuration.billingEmail,
          name: configuration.displayName,
        },
        { provider: githubWorld },
      );
      state.organizationLogin = owner;
      state.organizationSettingsId = settings.id;
      return {
        externalOrganizationLogin: owner,
        externalOrganizationId: settings.id,
        externalPrincipalLogin: pulumi.output(null),
        externalMembershipId: pulumi.output(null),
      };
    },
    allocateMember: async ({ $, allocation, state, provider }) => {
      const githubWorld = githubProvider($`provider`, state.organizationLogin, provider);
      const membership = new github.Membership(
        $`member`,
        { username: allocation.username, role: allocation.role },
        { provider: githubWorld },
      );
      return {
        externalOrganizationLogin: pulumi.output(state.organizationLogin),
        externalOrganizationId: pulumi.output(state.organizationSettingsId),
        externalPrincipalLogin: pulumi.output(allocation.username),
        externalMembershipId: membership.id,
      };
    },
  },
  ["organization-membership-invitations", "organization-settings"] as const,
);

export default integration;
