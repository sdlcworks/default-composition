import { beforeAll, describe, expect, test } from "bun:test";
import * as pulumi from "@pulumi/pulumi";

type RegisteredResource = {
  type: string;
  name: string;
  inputs: Record<string, unknown>;
};

const resources: RegisteredResource[] = [];

beforeAll(() => {
  pulumi.runtime.setMocks({
    newResource: (args) => {
      if (args.type !== "pulumi:pulumi:Stack") {
        resources.push({ type: args.type, name: args.name, inputs: args.inputs });
      }
      return { id: `${args.name}-external-id`, state: args.inputs };
    },
    call: (args) => args.inputs,
  });
});

const modulePromise = import("../../organization-integrations/github-organization/index.ts");

describe("github organization integration", () => {
  test("declares the closed entity schemas", async () => {
    const integration = (await modulePromise).default;
    expect(integration.opts.configurationSchema.parse({
      organizationLogin: "systemsway",
      billingEmail: "billing@example.com",
      displayName: "Systemsway",
    })).toEqual({
      organizationLogin: "systemsway",
      billingEmail: "billing@example.com",
      displayName: "Systemsway",
    });
    expect(integration.opts.memberAllocationSchema.parse({
      username: "octocat",
    })).toEqual({ username: "octocat", role: "member" });
    expect(() => integration.opts.memberAllocationSchema.parse({
      username: "octocat",
      role: "outside-collaborator",
    })).toThrow();
  });

  test("binds the root declaration and exact capability demand", async () => {
    const integration = (await modulePromise).default;
    const declaration = (await import("../../providers/github/index.ts")).default;
    expect(Object.keys(integration.realizations)).toEqual(["github"]);
    expect(integration.realizations.github?.declaration).toBe(declaration);
    expect(integration.realizations.github?.demandedCapabilities).toEqual([
      "organization-membership-invitations",
      "organization-settings",
    ]);
  });

  test("provisions organization settings and records external organization identity", async () => {
    resources.length = 0;
    const integration = (await modulePromise).default;
    const realization = integration.realizations.github!;
    const state: Record<string, unknown> = {};
    const outputs = await pulumi.runtime.runInPulumiStack(async () => realization.provision({
      organizationId: "platform-org",
      integrationName: "source-control",
      $: ((first: TemplateStringsArray | string, ...values: unknown[]) =>
        typeof first === "string" ? first : String.raw({ raw: first }, ...values)) as never,
      configuration: {
        organizationLogin: "systemsway",
        billingEmail: "billing@example.com",
        displayName: "Systemsway",
      },
      state,
      provider: { GH_TOKEN: "secret-token" },
    }));
    expect(resources.map(({ type }) => type)).toEqual([
      "pulumi:providers:github",
      "github:index/organizationSettings:OrganizationSettings",
    ]);
    expect(resources[1]?.inputs).toMatchObject({
      billingEmail: "billing@example.com",
      name: "Systemsway",
    });
    await expect((pulumi.all(outputs as unknown as Record<string, pulumi.Output<unknown>>) as unknown as { promise(): Promise<unknown> }).promise()).resolves.toEqual({
      externalOrganizationLogin: "systemsway",
      externalOrganizationId: expect.any(String),
      externalPrincipalLogin: null,
      externalMembershipId: null,
    });
    expect(state).toEqual({
      organizationLogin: expect.any(pulumi.Output as unknown as new (...args: unknown[]) => unknown),
      organizationSettingsId: expect.any(pulumi.Output as unknown as new (...args: unknown[]) => unknown),
    });
  });

  test("allocates a member as the invitation-backed desired-state resource", async () => {
    resources.length = 0;
    const integration = (await modulePromise).default;
    const realization = integration.realizations.github!;
    const outputs = await pulumi.runtime.runInPulumiStack(async () => realization.allocateMember({
      organizationId: "platform-org",
      integrationName: "source-control",
      memberId: "principal-123",
      $: ((first: TemplateStringsArray | string, ...values: unknown[]) =>
        typeof first === "string" ? first : String.raw({ raw: first }, ...values)) as never,
      allocation: { username: "octocat", role: "admin" },
      state: {
        organizationLogin: "systemsway",
        organizationSettingsId: "settings-123",
      },
      provider: { GH_TOKEN: "secret-token" },
    }));
    expect(resources.map(({ type }) => type)).toEqual([
      "pulumi:providers:github",
      "github:index/membership:Membership",
    ]);
    expect(resources[1]?.inputs).toMatchObject({ username: "octocat", role: "admin" });
    await expect((pulumi.all(outputs as unknown as Record<string, pulumi.Output<unknown>>) as unknown as { promise(): Promise<unknown> }).promise()).resolves.toEqual({
      externalOrganizationLogin: "systemsway",
      externalOrganizationId: "settings-123",
      externalPrincipalLogin: "octocat",
      externalMembershipId: expect.any(String),
    });
  });
});
