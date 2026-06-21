/**
 * @module @netscript/plugin-auth/public
 *
 * Public manifest and constants for the auth plugin package.
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
import {
  AUTH_API_DEFAULT_PORT,
  AUTH_API_SERVICE_NAME,
  AUTH_PLUGIN_ID,
  AUTH_PLUGIN_VERSION,
} from '../constants.ts';

const AUTH_SERVICE_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
] as const;

/** Structural plugin manifest dependency reference. */
export type AuthPluginDependencyManifest = Readonly<{
  name?: string;
  version?: string;
  [key: string]: unknown;
}>;

/** Typed dependencies consumed by the auth plugin manifest. */
export type AuthPluginDependencies = Readonly<Record<string, AuthPluginDependencyManifest>>;

/** Structural service contribution in the auth plugin manifest. */
export type AuthServiceContribution = Readonly<{
  name: string;
  entrypoint: string;
  port?: number;
}>;

/** Structural runtime config topic contribution in the auth plugin manifest. */
export type AuthRuntimeConfigTopicContribution = Readonly<{
  name: string;
  schemaPath?: string;
}>;

/** Structural contract version contribution in the auth plugin manifest. */
export type AuthContractVersionContribution = Readonly<{
  version: string;
  loader: string;
}>;

/** Public contribution groups exposed by the auth plugin. */
export interface AuthPluginContributions {
  /** Auth API service contribution. */
  readonly services?: readonly AuthServiceContribution[];
  /** Runtime config topic contribution for auth settings. */
  readonly runtimeConfigTopics?: readonly AuthRuntimeConfigTopicContribution[];
  /** Contract versions exposed by the auth API. */
  readonly contractVersions?: readonly AuthContractVersionContribution[];
}

/** Public manifest shape for the auth plugin. */
export interface AuthPluginManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Declared typed plugin dependencies. */
  readonly dependencies: AuthPluginDependencies;
  /** Declared contribution axes. */
  readonly contributions: AuthPluginContributions;
  /** Additional manifest metadata carried by the plugin host. */
  readonly [key: string]: unknown;
}

/** Inspection summary for the auth plugin manifest. */
export interface AuthPluginInspection {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Names of declared dependency aliases. */
  readonly dependencies: readonly string[];
  /** Names of declared contribution axes. */
  readonly axes: readonly string[];
}

const authManifest: PluginManifest = definePlugin(
  '@netscript/plugin-auth',
  AUTH_PLUGIN_VERSION,
)
  .withDisplayName('Auth')
  .withType('api')
  .withDescription('Unified auth API surface for NetScript applications.')
  .withAuthor('NetScript Team')
  .withLicense('MIT')
  .withTags(['auth', 'oauth', 'oidc', 'sessions'])
  .withPermissions(AUTH_SERVICE_PERMISSIONS)
  .withDependencies({})
  .withService({
    name: AUTH_API_SERVICE_NAME,
    entrypoint: './services/src/main.ts',
    port: AUTH_API_DEFAULT_PORT,
  })
  .withContractVersions([{ version: 'v1', loader: './contracts.ts' }])
  .withRuntimeConfigTopics([{ name: AUTH_PLUGIN_ID }])
  .withMetadata({
    repository: 'https://github.com/rickylabs/netscript',
    documentation:
      'https://github.com/rickylabs/netscript/tree/feat/prime-time/auth/plugins/auth#readme',
    features: [
      'Unified auth oRPC service',
      'Single active backend selection',
      'KV OAuth interactive flow support',
      'WorkOS and better-auth session authentication',
    ],
    requirements: {
      deno: '>=2.0.0',
      netscript: '>=1.0.0',
    },
  })
  .build();

/** Plugin manifest for NetScript auth. */
export const authPlugin: AuthPluginManifest = authManifest as unknown as AuthPluginManifest;

/** Inspect the auth plugin manifest without invoking lifecycle hooks. */
export function inspectAuth(
  manifest: AuthPluginManifest = authPlugin,
): AuthPluginInspection {
  return Object.freeze({
    name: manifest.name,
    version: manifest.version,
    dependencies: Object.freeze(Object.keys(manifest.dependencies)),
    axes: Object.freeze(Object.keys(manifest.contributions)),
  });
}

export {
  AUTH_API_DEFAULT_PORT,
  AUTH_API_SERVICE_NAME,
  AUTH_PLUGIN_ID,
  AUTH_PLUGIN_VERSION,
} from '../constants.ts';
export type { AuthApiServiceName, AuthPluginId, AuthPluginVersion } from '../constants.ts';
