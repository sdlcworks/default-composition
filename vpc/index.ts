import gcloudDeclaration from "../providers/gcloud";
import { gcloudProviderFromWorld } from "../_internal/gcloud-provider";

import { z } from "zod";

import { InfraComponent } from "@sdlcworks/components";

import * as gcp from "@pulumi/gcp";

// ---- Zod Enums for Config Options ----

const RoutingMode = z.enum(["REGIONAL", "GLOBAL"]);

const BgpBestPathSelectionMode = z.enum(["LEGACY", "STANDARD"]);

const BgpInterRegionCost = z.enum(["DEFAULT", "ADD_COST_TO_MED"]);

const NatIpAllocateOption = z.enum(["AUTO_ONLY", "MANUAL_ONLY"]);

const SourceSubnetworkIpRangesToNat = z.enum([
  "ALL_SUBNETWORKS_ALL_IP_RANGES",
  "ALL_SUBNETWORKS_ALL_PRIMARY_IP_RANGES",
  "LIST_OF_SUBNETWORKS",
]);

const NatLogFilter = z.enum(["ERRORS_ONLY", "TRANSLATIONS_ONLY", "ALL"]);

// ---- Component Definition ----

const ConfigSchema = z.object({
    // Core
    region: z.string().default("us-central1"),

    // Network Settings
    routingMode: RoutingMode.default("GLOBAL"),
    mtu: z.number().min(1300).max(8896).default(1460),
    deleteDefaultRoutesOnCreate: z.boolean().default(false),

    // BGP Settings (for advanced routing)
    bgpBestPathSelectionMode: BgpBestPathSelectionMode.optional(),
    bgpAlwaysCompareMed: z.boolean().optional(),
    bgpInterRegionCost: BgpInterRegionCost.optional(),

    // IPv6
    enableUlaInternalIpv6: z.boolean().default(false),
    internalIpv6Range: z.string().optional(),

    // Router + NAT Configuration
    enableNat: z.boolean().default(true),
    routerAsn: z.number().default(64514),
    natIpAllocateOption: NatIpAllocateOption.default("AUTO_ONLY"),
    sourceSubnetworkIpRangesToNat: SourceSubnetworkIpRangesToNat.default(
      "ALL_SUBNETWORKS_ALL_IP_RANGES"
    ),
    enableNatLogging: z.boolean().default(true),
    natLogFilter: NatLogFilter.default("ERRORS_ONLY"),

    // Internal Firewall
    enableInternalFirewall: z.boolean().default(true),
    internalSourceRanges: z.array(z.string()).default(["10.0.0.0/8"]),
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
    // Network outputs
    id: z.string(),
    selfLink: z.string(),
    name: z.string(),
    gatewayIpv4: z.string(),

    // Router outputs (optional when NAT disabled)
    routerId: z.string().optional(),
    routerSelfLink: z.string().optional(),

    // NAT outputs (optional when NAT disabled)
    natId: z.string().optional(),
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
    const { enableNat, enableNatLogging, natLogFilter, enableInternalFirewall } = config;

    // 1. Create VPC Network
    const vpc = new gcp.compute.Network($`vpc`, {
      autoCreateSubnetworks: false,
      routingMode: ctx.inputs.routingMode,
      mtu: ctx.inputs.mtu,
      deleteDefaultRoutesOnCreate: ctx.inputs.deleteDefaultRoutesOnCreate,
      bgpBestPathSelectionMode: ctx.inputs.bgpBestPathSelectionMode,
      bgpAlwaysCompareMed: ctx.inputs.bgpAlwaysCompareMed,
      bgpInterRegionCost: ctx.inputs.bgpInterRegionCost,
      enableUlaInternalIpv6: ctx.inputs.enableUlaInternalIpv6,
      internalIpv6Range: ctx.inputs.internalIpv6Range,
      description: "VPC network managed by sdlc.works",
    }, gcpOpts);

    // 2. Conditionally create Router + NAT
    let router: gcp.compute.Router | undefined;
    let nat: gcp.compute.RouterNat | undefined;

    if (enableNat) {
      router = new gcp.compute.Router($`router`, {
        network: vpc.id,
        region: ctx.inputs.region,
        bgp: { asn: ctx.inputs.routerAsn },
      }, gcpOpts);

      nat = new gcp.compute.RouterNat($`nat`, {
        router: router.name,
        region: ctx.inputs.region,
        natIpAllocateOption: ctx.inputs.natIpAllocateOption,
        sourceSubnetworkIpRangesToNat: ctx.inputs.sourceSubnetworkIpRangesToNat,
        logConfig: enableNatLogging
          ? { enable: true, filter: natLogFilter }
          : undefined,
      }, gcpOpts);
    }

    // 3. Conditionally create internal firewall
    if (enableInternalFirewall) {
      new gcp.compute.Firewall($`allow-internal`, {
        network: vpc.id,
        sourceRanges: ctx.inputs.internalSourceRanges,
        allows: [
          { protocol: "icmp" },
          { protocol: "tcp", ports: ["0-65535"] },
          { protocol: "udp", ports: ["0-65535"] },
        ],
        description: "Allow internal traffic between instances",
      }, gcpOpts);
    }

    // 4. Return outputs
    return {
      id: vpc.id,
      selfLink: vpc.selfLink,
      name: vpc.name,
      gatewayIpv4: vpc.gatewayIpv4,
      routerId: router?.id,
      routerSelfLink: router?.selfLink,
      natId: nat?.id,
    };
  },
}, ["infrastructure"] as const);

export default component;
