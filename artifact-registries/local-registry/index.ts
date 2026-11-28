import localLinuxDeclaration from "../../providers/local-linux";
import localMacosDeclaration from "../../providers/local-macos";

import { execFileSync } from "node:child_process";
import {
  ArtifactRegistry,
  DeploymentArtifactType,
  type ArtifactRegistryFnsDef,
  type ProviderWorld,
} from "@sdlcworks/components";
import { z } from "zod";
import { ensureSubstrate } from "../../_internal/local-substrate";

const ConfigSchema = z.object({
  repositoryPrefix: z.string().min(1).default("sdlc"),
});

const StateSchema = z.object({
  pushAddress: z.string(),
  repositoryPrefix: z.string(),
});

const registry = new ArtifactRegistry({
  acceptedArtifactTypes: [DeploymentArtifactType.oci_spec_image],
  configSchema: ConfigSchema,
  stateSchema: StateSchema,
});

function docker(args: string[]): void {
  execFileSync("docker", args, { stdio: "inherit" });
}

const machineLocalRealization: ArtifactRegistryFnsDef<
  typeof ConfigSchema.shape,
  ProviderWorld<typeof localMacosDeclaration>,
  typeof StateSchema.shape
> = {
  provision: async ({ config, state }) => {
    const effective = config as unknown as z.infer<typeof ConfigSchema>;
    const substrate = await ensureSubstrate();
    state.pushAddress = substrate.registryPushAddress;
    state.repositoryPrefix = effective.repositoryPrefix;
  },

  publish: async ({ componentName, artifacts, version, state }) => {
    const out: Record<string, { uri: string }> = {};
    for (const [label, artifact] of Object.entries(artifacts)) {
      if (artifact.type !== DeploymentArtifactType.oci_spec_image) {
        throw new Error(
          `machine-local registry: artifact label "${label}" of "${componentName}" is "${artifact.type}"; this registry publishes only OCI images`,
        );
      }
      const target = `${state.pushAddress}/${state.repositoryPrefix}/${componentName}-${label}:${version}`;
      docker(["pull", artifact.uri]);
      docker(["tag", artifact.uri, target]);
      docker(["push", target]);
      out[label] = { uri: target };
    }
    return { artifacts: out };
  },
};

registry.implement(localMacosDeclaration, machineLocalRealization, [] as const);
registry.implement(localLinuxDeclaration, machineLocalRealization, [] as const);

export default registry;
