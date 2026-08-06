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

/** Package-owned structural validator for plugin capabilities documents. */
export interface PluginCapabilitiesValidator {
  /** Standard Schema metadata consumed by oRPC. */
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
      options?: { readonly libraryOptions?: Record<string, unknown> | undefined },
    ) =>
      | { readonly value: PluginCapabilities; readonly issues?: undefined }
      | {
        readonly issues: ReadonlyArray<{
          readonly message: string;
          readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
        }>;
      }
      | Promise<
        | { readonly value: PluginCapabilities; readonly issues?: undefined }
        | {
          readonly issues: ReadonlyArray<{
            readonly message: string;
            readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
          }>;
        }
      >;
    readonly types?: {
      readonly input: unknown;
      readonly output: PluginCapabilities;
    } | undefined;
  };
  /** Parse a capabilities document or throw a validation error. */
  parse(value: unknown): PluginCapabilities;
  /** Validate a capabilities document without throwing. */
  safeParse(value: unknown):
    | { readonly success: true; readonly data: PluginCapabilities }
    | { readonly success: false; readonly error: unknown };
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
export const PluginCapabilitiesSchema: PluginCapabilitiesValidator = z.object({
  pluginName: z.string().describe('Canonical plugin package name'),
  contractVersions: z.array(z.string()).describe('Contract version identifiers served'),
  routeGroups: z.array(z.string()).describe('Route group names exposed by the plugin'),
  capabilities: z.array(z.string()).describe('Capability tags advertised by the plugin'),
});
