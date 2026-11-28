import { describe, expect, test } from "bun:test";
import {
  loadLocalIngress,
  loadLocalRegistry,
  loadWorkloadHost,
} from "./load-local-linux";

const LINUX_WORLD_LABEL = "local-linux";

describe("machine-local workload host declaration (linux world)", () => {
  test("registers its realization under the open label", async () => {
    const { default: workloadHost } = await loadWorkloadHost();
    expect(Object.keys(workloadHost.providers)).toContain(LINUX_WORLD_LABEL);
  });

  test("declares the full entity contract once at the entity level", async () => {
    const { default: workloadHost } = await loadWorkloadHost();
    const bundle = workloadHost.getPortableSchemas();
    expect(Object.keys(bundle.schemas.deployment_inputs).sort()).toEqual([
      "http-service",
      "postgres",
      "tcp-service",
    ]);
    expect(bundle.connection_types).toHaveProperty("public");
    expect(bundle.connection_types).toHaveProperty("internal");
    expect(bundle.connection_types).toHaveProperty("postgres");
    expect(bundle.schemas.output.properties).toHaveProperty("apiServerUrl");
  });
});

describe("local-ingress endpoint register declaration (linux world)", () => {
  test("registers its realization under the open label", async () => {
    const { default: localIngress } = await loadLocalIngress();
    expect(Object.keys(localIngress.realizations)).toContain(
      LINUX_WORLD_LABEL,
    );
  });
});

describe("local-registry artifact registry declaration (linux world)", () => {
  test("registers its realization under the open label", async () => {
    const { default: localRegistry } = await loadLocalRegistry();
    expect(Object.keys(localRegistry.realizations)).toContain(
      LINUX_WORLD_LABEL,
    );
  });
});
