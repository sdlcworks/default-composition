import { expect, test, beforeEach } from "bun:test";
import { captured, resetCaptured, namingTag } from "../pulumi-cloud-mocks";
const allocate = async (
  name = "first",
  publicAccess = false,
  credentials: Record<string, string> = {
    CLOUDFLARE_API_TOKEN: "synthetic-scoped",
    CLOUDFLARE_ACCOUNT_ID: "account",
  },
) => {
  const component = (await import("../../bucket/index")).default;
  const state: any = {};
  await component.providers.cloudflare.allocateWithPulumiCtx!({
    name,
    deploymentConfig: { name: `bucket-${name}`, publicAccess },
    state,
    $: namingTag,
    getCredentials: () => credentials,
  } as any);
  return state;
};
beforeEach(resetCaptured);
test("private allocation uses scoped explicit provider", async () => {
  const state = await allocate();
  expect(captured.cloudflareProviders[0].args.apiToken).toBe(
    "synthetic-scoped",
  );
  expect(captured.r2Buckets[0].opts?.provider).toBeDefined();
  expect(captured.r2Domains).toHaveLength(0);
  expect(state.allocations.first.bucketName).toBe("bucket-first");
});
test("public domain shares bucket provider and dependency", async () => {
  await allocate("public", true);
  expect(captured.r2Domains[0].opts?.provider).toBe(
    captured.r2Buckets[0].opts?.provider,
  );
  expect(captured.r2Domains[0].opts?.dependsOn).toHaveLength(1);
});
test("provider names distinguish placements and repeat stably", async () => {
  for (const n of ["one", "two", "three", "one"]) await allocate(n);
  const names = captured.cloudflareProviders.map((x) => x.name);
  expect(new Set(names.slice(0, 3)).size).toBe(3);
  expect(names[3]).toBe(names[0]);
});
test("ambient token cannot replace missing scoped token", async () => {
  const old = process.env.CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_API_TOKEN = "unrelated-synthetic";
  try {
    await expect(
      allocate("missing", false, { CLOUDFLARE_ACCOUNT_ID: "account" }),
    ).rejects.toThrow(/missing in bound credentials/);
    expect(captured.r2Buckets).toHaveLength(0);
    expect(captured.r2Domains).toHaveLength(0);
  } finally {
    if (old === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
    else process.env.CLOUDFLARE_API_TOKEN = old;
  }
});
