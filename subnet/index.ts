import gcloudDeclaration from "../providers/gcloud";
import { gcloudProviderFromWorld } from "../_internal/gcloud-provider";

import { z } from "zod";

import { InfraComponent } from "@sdlcworks/components";

import * as gcp from "@pulumi/gcp";

// ---- Zod Enums for Config Options ----

const SubnetPurpose = z.enum([
  "PRIVATE",
  "REGIONAL_MANAGED_PROXY",
  "GLOBAL_MANAGED_PROXY",
  "PRIVATE_SERVICE_CONNECT",
  "PRIVATE_NAT",
]);

const SubnetRole = z.enum(["ACTIVE", "BACKUP"]);

const StackType = z.enum(["IPV4_ONLY", "IPV4_IPV6", "IPV6_ONLY"]);

const Ipv6AccessType = z.enum(["EXTERNAL", "INTERNAL"]);

const LogAggregationInterval = z.enum([
  "INTERVAL_5_SEC",
  "INTERVAL_30_SEC",
  "INTERVAL_1_MIN",
  "INTERVAL_5_MIN",
  "INTERVAL_10_MIN",
  "INTERVAL_15_MIN",
]);

const LogMetadata = z.enum([
  "INCLUDE_ALL_METADATA",
  "EXCLUDE_ALL_METADATA",
  "CUSTOM_METADATA",
]);

// ---- Reusable Schema Definitions ----

const SecondaryIpRangeSchema = z.object({
  rangeName: z.string(),
  ipCidrRange: z.string(),
});

const FlowLogConfigSchema = z.object({
  aggregationInterval: LogAggregationInterval.default("INTERVAL_5_SEC"),
  flowSampling: z.number().min(0).max(1).default(0.5),
  metadata: LogMetadata.default("INCLUDE_ALL_METADATA"),
  filterExpr: z.string().optional(),
});

// ---- Component Definition ----

const ConfigSchema = z.object({
    // Core (interop with VPC)
    networkId: z.string(),
    region: z.string().default("us-central1"),
    ipCidrRange: z.string(),

    // Subnet Purpose & Role
    purpose: SubnetPurpose.default("PRIVATE"),
    role: SubnetRole.optional(),

    // IP Stack Configuration
    stackType: StackType.default("IPV4_ONLY"),
    ipv6AccessType: Ipv6AccessType.optional(),

    // Private Access
    privateIpGoogleAccess: z.boolean().default(true),
    privateIpv6GoogleAccess: z.string().optional(),

    // Secondary IP Ranges (for GKE pods/services)
    secondaryIpRanges: z.array(SecondaryIpRangeSchema).default([]),

    // Flow Logs
    enableFlowLogs: z.boolean().default(false),
    flowLogConfig: FlowLogConfigSchema.optional(),
  });

const component = new InfraComponent({
  metadata: {
    stateful: false,
    proxiable: false,
  },
  connectionTypes: {},
  configSchema: ConfigSchema,
  appComponentTypes: {},
  outputSchema: z.object({
    // Core outputs
    id: z.string(),
    selfLink: z.string(),
    name: z.string(),
    region: z.string(),

    // IP outputs
    ipCidrRange: z.string(),
    gatewayAddress: z.string(),

    // IPv6 outputs (when enabled)
    externalIpv6Prefix: z.string().optional(),

    // Secondary ranges (for GKE reference)
    secondaryIpRanges: z.array(SecondaryIpRangeSchema),
  }),
});


// ---- GCloud Provider Implementation ----

component.implement(gcloudDeclaration, {
  pulumi: async (ctx) => {
    const { $, provider: world } = ctx;
    const config = ctx.inputs as unknown as z.infer<typeof ConfigSchema>;
    const gcpProvider = gcloudProviderFromWorld($`gcloud-provider`, world);
    const gcpOpts: import("@pulumi/pulumi").CustomResourceOptions = gcpProvider
      ? { provider: gcpProvider }
      : {};
    const { purpose, privateIpGoogleAccess, enableFlowLogs, flowLogConfig } = config;

    // Proxy-type subnets (REGIONAL_MANAGED_PROXY, GLOBAL_MANAGED_PROXY) don't support privateIpGoogleAccess
    const isProxySubnet = purpose === "REGIONAL_MANAGED_PROXY" || purpose === "GLOBAL_MANAGED_PROXY";

    const subnet = new gcp.compute.Subnetwork($`subnet`, {
      network: ctx.inputs.networkId,
      region: ctx.inputs.region,
      ipCidrRange: ctx.inputs.ipCidrRange,
      purpose: ctx.inputs.purpose,
      role: ctx.inputs.role,
      stackType: ctx.inputs.stackType,
      ipv6AccessType: ctx.inputs.ipv6AccessType,
      privateIpGoogleAccess: isProxySubnet ? undefined : privateIpGoogleAccess,
      privateIpv6GoogleAccess: ctx.inputs.privateIpv6GoogleAccess,
      secondaryIpRanges: ctx.inputs.secondaryIpRanges,
      logConfig:
        enableFlowLogs && flowLogConfig
          ? {
              aggregationInterval: flowLogConfig.aggregationInterval,
              flowSampling: flowLogConfig.flowSampling,
              metadata: flowLogConfig.metadata,
              filterExpr: flowLogConfig.filterExpr,
            }
          : undefined,
      description: "Subnet managed by sdlc.works",
    }, gcpOpts);

    return {
      id: subnet.id,
      selfLink: subnet.selfLink,
      name: subnet.name,
      region: subnet.region,
      ipCidrRange: subnet.ipCidrRange,
      gatewayAddress: subnet.gatewayAddress,
      externalIpv6Prefix: subnet.externalIpv6Prefix,
      secondaryIpRanges: subnet.secondaryIpRanges,
    };
  },
}, ["infrastructure"] as const);

export default component;
