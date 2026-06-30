/**
 * Capabilities contract for the mandatory plugin `describe` route.
 *
 * Every feature plugin exposes a typed, marketplace-discoverable capabilities
 * document so hosts and tooling can introspect what a running plugin provides
 * without parsing source. This module owns the output schema for that document
 * and its inferred TypeScript type.
 *
 * @module
 */

import { z } from 'zod';

/**
 * Marketplace-discoverable description of a running plugin's surface.
 *
 * Returned by the mandatory `describe` route every feature plugin contract
 * carries (see `BASE_PLUGIN_CONTRACT_ROUTES`).
 */
export interface PluginCapabilities {
  /** Canonical plugin package name, for example `@netscript/plugin-workers`. */
  readonly pluginName: string;
  /** Contract version identifiers the plugin serves, for example `["v1"]`. */
  readonly contractVersions: readonly string[];
  /** Route group names exposed by the plugin, for example `["jobs", "tasks"]`. */
  readonly routeGroups: readonly string[];
  /** Free-form capability tags advertised by the plugin. */
  readonly capabilities: readonly string[];
}

/**
 * oRPC output schema for the mandatory plugin `describe` route.
 *
 * @example Validate a capabilities document
 * ```ts
 * import { PluginCapabilitiesSchema } from '@netscript/plugin/contract-base';
 *
 * const doc = PluginCapabilitiesSchema.parse({
 *   pluginName: '@netscript/plugin-workers',
 *   contractVersions: ['v1'],
 *   routeGroups: ['jobs'],
 *   capabilities: ['background-processor'],
 * });
 * ```
 */
export const PluginCapabilitiesSchema: z.ZodType<PluginCapabilities> = z.object({
  pluginName: z.string().describe('Canonical plugin package name'),
  contractVersions: z.array(z.string()).describe('Contract version identifiers served'),
  routeGroups: z.array(z.string()).describe('Route group names exposed by the plugin'),
  capabilities: z.array(z.string()).describe('Capability tags advertised by the plugin'),
});
