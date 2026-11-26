import { afterEach, describe, expect, test } from "bun:test";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function loadProvider(response?: Response | Error) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    expect(String(input)).toBe("https://api.github.com/user");
    if (response === undefined) throw new Error("fetch must not be called");
    if (response instanceof Error) throw response;
    return response;
  }) as typeof fetch;
  return (await import(`../../providers/github/index.ts?case=${crypto.randomUUID()}`)).default;
}

describe("github provider declaration", () => {
  test("declares release publication and the organization abilities the integration demands", async () => {
    const declaration = await loadProvider();
    expect(declaration.label).toBe("github");
    expect([...declaration.declaredCapabilities].sort()).toEqual([
      "organization-membership-invitations",
      "organization-settings",
      "release-publish",
    ]);
    expect(Object.keys(declaration.credentialElements)).toEqual(["GH_TOKEN"]);
    expect(declaration.credentialElements.GH_TOKEN).toMatchObject({
      required: true,
      confidential: true,
    });
  });

  test("initializes the stored envelope shape verbatim without probing", async () => {
    const declaration = await loadProvider();
    await expect(declaration.initialize({
      GH_TOKEN: "secret-token",
      EXTRA: "carried",
    })).resolves.toEqual({
      outcome: "initialized",
      world: { GH_TOKEN: "secret-token", EXTRA: "carried" },
    });
  });

  test("refuses malformed material without disclosing it", async () => {
    const declaration = await loadProvider();
    const token = "never-print-this";
    const result = await declaration.initialize({ GH_TOKEN: 4, note: token });
    expect(result.outcome).toBe("refused");
    expect(JSON.stringify(result)).not.toContain(token);
  });

  test("validates admin:org independently for both organization capabilities", async () => {
    const declaration = await loadProvider(new Response("{}", {
      status: 200,
      headers: { "x-oauth-scopes": "repo, admin:org" },
    }));
    const world = { GH_TOKEN: "secret-token" };
    await expect(declaration.validateCapability(
      "organization-settings",
      world,
    )).resolves.toEqual({ outcome: "satisfied" });
    await expect(declaration.validateCapability(
      "organization-membership-invitations",
      world,
    )).resolves.toEqual({ outcome: "satisfied" });
  });

  test("names the missing-scope refusal for both organization capabilities", async () => {
    const declaration = await loadProvider(new Response("{}", {
      status: 200,
      headers: { "x-oauth-scopes": "repo" },
    }));
    const world = { GH_TOKEN: "secret-token" };
    for (const capability of ["organization-settings", "organization-membership-invitations"]) {
      await expect(declaration.validateCapability(capability, world)).resolves.toEqual({
        outcome: "refused",
        reason: "github-admin-org-scope-required",
      });
    }
  });

  test("names the token refusal without disclosing the token", async () => {
    const declaration = await loadProvider(new Response("denied", { status: 401 }));
    const token = "never-print-this";
    const result = await declaration.validateCapability(
      "organization-settings",
      { GH_TOKEN: token },
    );
    expect(result).toEqual({ outcome: "refused", reason: "github-token-verify-401" });
    expect(JSON.stringify(result)).not.toContain(token);
  });

  test("validates release publication by token acceptance alone", async () => {
    const declaration = await loadProvider(new Response("{}", {
      status: 200,
      headers: { "x-oauth-scopes": "repo" },
    }));
    await expect(declaration.validateCapability(
      "release-publish",
      { GH_TOKEN: "secret-token" },
    )).resolves.toEqual({ outcome: "satisfied" });
  });

  test("reports transport failures as unable to answer", async () => {
    const declaration = await loadProvider(new Error("network unavailable"));
    const result = await declaration.validateCapability(
      "organization-settings",
      { GH_TOKEN: "secret-token" },
    );
    expect(result.outcome).toBe("unable-to-answer");
  });
});
