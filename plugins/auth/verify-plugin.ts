/**
 * Manifest verification for `@netscript/plugin-auth`.
 *
 * @module
 */

import {
  type PluginVerificationResult,
  runPluginVerificationCli,
  verifyPlugin,
} from '@netscript/plugin';
import { authPlugin } from './mod.ts';
import { PLUGIN_PACKAGE_VERSION } from './src/package-metadata.generated.ts';

export type { InspectionReport } from '@netscript/plugin';

/** Verify that the auth plugin manifest exposes the expected contribution axes. */
export function verifyAuthPlugin(): PluginVerificationResult {
  return verifyPlugin(authPlugin, {
    name: '@netscript/plugin-auth',
    version: PLUGIN_PACKAGE_VERSION,
    services: [{ name: 'auth-api', message: 'expected an auth-api service contribution' }],
    contractVersions: [{
      version: 'v1',
      loader: './contracts/v1/mod.ts',
      message: 'expected the auth v1 contract contribution',
    }],
    runtimeConfigTopics: [{
      name: 'auth',
      message: 'expected the auth runtime config topic contribution',
    }],
  });
}

if (import.meta.main) {
  runPluginVerificationCli(verifyAuthPlugin());
}
