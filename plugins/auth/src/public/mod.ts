/**
 * @module @netscript/plugin-auth/public
 *
 * Public manifest and constants for the auth plugin package.
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
export type { PluginManifest } from '@netscript/plugin';
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

const builtAuthManifest: PluginManifest = definePlugin(
  '@netscript/plugin-auth',
  AUTH_PLUGIN_VERSION,
)
  .withDisplayName('Auth')
  .withType('api')
  .withDescription('Unified auth API surface for NetScript applications.')
  .withAuthor('NetScript Team')
  .withLicense('Apache-2.0')
  .withTags(['auth', 'oauth', 'oidc', 'sessions'])
  .withPermissions(AUTH_SERVICE_PERMISSIONS)
  .withDependencies({})
  .withService({
    name: AUTH_API_SERVICE_NAME,
    entrypoint: './services/src/main.ts',
    port: AUTH_API_DEFAULT_PORT,
  })
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
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

const authManifest: PluginManifest = Object.freeze({
  ...builtAuthManifest,
  contributions: Object.freeze({
    ...builtAuthManifest.contributions,
    cli: { doctorChecks: ['auth-backend'] as const },
  }),
});

/** Plugin manifest for NetScript auth. */
export const authPlugin: PluginManifest = authManifest;

export {
  AUTH_API_DEFAULT_PORT,
  AUTH_API_SERVICE_NAME,
  AUTH_PLUGIN_ID,
  AUTH_PLUGIN_VERSION,
} from '../constants.ts';
export type { AuthApiServiceName, AuthPluginId, AuthPluginVersion } from '../constants.ts';
