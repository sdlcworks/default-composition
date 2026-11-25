import { afterEach, describe, expect, test } from "bun:test";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function loadProvider(response: Response | Error) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    expect(String(input)).toBe("https://github.example/api/v3/user");
    if (response instanceof Error) throw response;
    return response;
  }) as typeof fetch;
  return (await import(`../../providers/github/index.ts?case=${crypto.randomUUID()}`)).default;
}

describe("github provider declaration", () => {
  test("declares only the organization abilities the integration demands", async () => {
    const declaration = await loadProvider(new Response("{}", {
      status: 200,
      headers: { "x-oauth-scopes": "repo, admin:org" },
    }));
    expect(declaration.label).toBe("github");
    expect(declaration.declaredCapabilities).toEqual([
      "organization-membership-invitations",
      "organization-settings",
    ]);
    expect(declaration.credentialElements).toEqual({
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
    });
  });

  test("normalizes the API base and initializes an authenticated world", async () => {
    const declaration = await loadProvider(new Response("{}", {
      status: 200,
      headers: { "x-oauth-scopes": "repo, admin:org" },
    }));
    await expect(declaration.initialize({
      token: "secret-token",
      baseUrl: "https://github.example/api/v3",
    })).resolves.toEqual({
      outcome: "initialized",
      world: {
        token: "secret-token",
        baseUrl: "https://github.example/api/v3/",
        scopes: ["admin:org", "repo"],
      },
    });
  });

  test("refuses malformed material without disclosing it", async () => {
    const declaration = await loadProvider(new Response("{}", { status: 200 }));
    const token = "never-print-this";
    const result = await declaration.initialize({ token: 4, baseUrl: token });
    expect(result.outcome).toBe("refused");
    expect(JSON.stringify(result)).not.toContain(token);
  });

  test("refuses rejected authentication without disclosing the token", async () => {
    const declaration = await loadProvider(new Response("denied", { status: 401 }));
    const token = "never-print-this";
    const result = await declaration.initialize({
      token,
      baseUrl: "https://github.example/api/v3/",
    });
    expect(result).toEqual({ outcome: "refused", reason: "github-credentials-refused" });
    expect(JSON.stringify(result)).not.toContain(token);
  });

  test("reports transport failures as unable to answer", async () => {
    const declaration = await loadProvider(new Error("network unavailable"));
    const result = await declaration.initialize({
      token: "secret-token",
      baseUrl: "https://github.example/api/v3/",
    });
    expect(result.outcome).toBe("unable-to-answer");
  });

  test("validates admin:org independently for both capabilities", async () => {
    const declaration = await loadProvider(new Response("{}", {
      status: 200,
      headers: { "x-oauth-scopes": "repo, admin:org" },
    }));
    const initialized = await declaration.initialize({
      token: "secret-token",
      baseUrl: "https://github.example/api/v3/",
    });
    if (initialized.outcome !== "initialized") throw new Error(initialized.outcome);
    await expect(declaration.validateCapability(
      "organization-settings",
      initialized.world,
    )).resolves.toEqual({ outcome: "satisfied" });
    await expect(declaration.validateCapability(
      "organization-membership-invitations",
      initialized.world,
    )).resolves.toEqual({ outcome: "satisfied" });
  });

  test("names the missing-scope refusal for both capabilities", async () => {
    const declaration = await loadProvider(new Response("{}", {
      status: 200,
      headers: { "x-oauth-scopes": "repo" },
    }));
    const initialized = await declaration.initialize({
      token: "secret-token",
      baseUrl: "https://github.example/api/v3/",
    });
    if (initialized.outcome !== "initialized") throw new Error(initialized.outcome);
    for (const capability of declaration.declaredCapabilities) {
      await expect(declaration.validateCapability(capability, initialized.world)).resolves.toEqual({
        outcome: "refused",
        reason: "github-admin-org-scope-required",
      });
    }
  });
});
