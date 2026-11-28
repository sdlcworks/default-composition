import localLinuxDeclaration from "../../providers/local-linux";
import localMacosDeclaration from "../../providers/local-macos";

import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import {
  URLRegister,
  type ProviderWorld,
  type URLRegisterFnsDef,
} from "@sdlcworks/components";
import { z } from "zod";
import { LocalPublicHttpCI } from "../../_internal/interfaces";
import {
  ensureSubstrate,
  SUBSTRATE_HTTP_PORT,
  toNamespaceName,
} from "../../_internal/local-substrate";

const RouteSchema = z.object({
  host: z.string().min(1),
  targetComponent: z.string().min(1),
  path: z.string().default("/"),
});

const ConfigSchema = z.object({
  routes: z.array(RouteSchema),
});

const StateSchema = z.object({
  namespace: z.string(),
});

const register = new URLRegister({
  interface: LocalPublicHttpCI,
  configSchema: ConfigSchema,
  stateSchema: StateSchema,
});

const machineLocalRealization: URLRegisterFnsDef<
  typeof LocalPublicHttpCI,
  typeof ConfigSchema.shape,
  ProviderWorld<typeof localMacosDeclaration>,
  typeof StateSchema.shape
> = {
  provision: async ({ config, state, components, $ }) => {
    const effective = config as unknown as z.infer<typeof ConfigSchema>;
    const substrate = await ensureSubstrate();
    const namespace = toNamespaceName($`ingress-ns`);
    state.namespace = namespace;

    const provider = new k8s.Provider($`k8s-provider`, {
      kubeconfig: substrate.kubeconfig,
    });
    new k8s.core.v1.Namespace(
      $`namespace`,
      { metadata: { name: namespace } },
      { provider },
    );

    const results: Record<string, pulumi.Output<string>> = {};
    for (const route of effective.routes) {
      const entry = components[route.targetComponent];
      if (!entry) {
        throw new Error(
          `machine-local ingress: route host "${route.host}" names component "${route.targetComponent}", which exposes no local public HTTP interface`,
        );
      }
      const fqHost = `${route.host}.localhost`;
      new k8s.networking.v1.Ingress(
        $(`route-${route.host}`),
        {
          metadata: {
            namespace: pulumi.output(entry.metadata.namespace),
            name: toNamespaceName($(`route-${route.host}`)),
          },
          spec: {
            rules: [
              {
                host: fqHost,
                http: {
                  paths: [
                    {
                      path: route.path,
                      pathType: "Prefix",
                      backend: {
                        service: {
                          name: pulumi.output(entry.metadata.serviceName),
                          port: {
                            number: pulumi.output(entry.metadata.port),
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        { provider },
      );
      results[route.targetComponent] = pulumi.output(
        `http://${fqHost}:${SUBSTRATE_HTTP_PORT}${route.path === "/" ? "" : route.path}`,
      );
    }
    return results;
  },
};

register.implement(localMacosDeclaration, machineLocalRealization, [] as const);
register.implement(localLinuxDeclaration, machineLocalRealization, [] as const);

export default register;
