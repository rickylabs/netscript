/**
 * Manifest verification for `@netscript/plugin-streams`.
 *
 * @module
 */

import {
  type PluginVerificationResult,
  runPluginVerificationCli,
  verifyPlugin,
} from '@netscript/plugin';
import { streamsPlugin } from './mod.ts';
import denoJson from './deno.json' with { type: 'json' };

/** Verify that the streams plugin manifest exposes the expected contribution axes. */
export function verifyStreamsPlugin(): PluginVerificationResult {
  return verifyPlugin(streamsPlugin, {
    name: '@netscript/plugin-streams',
    version: denoJson.version,
    services: [{ name: 'streams', message: 'expected a streams service contribution' }],
    telemetry: [{ name: 'streams', message: 'expected a streams telemetry contribution' }],
    e2e: [{ name: 'streams-health', message: 'expected a streams-health E2E contribution' }],
    aspire: {
      module: './src/aspire/mod.ts',
      message: 'expected the streams Aspire contribution module',
    },
  });
}

if (import.meta.main) {
  runPluginVerificationCli(verifyStreamsPlugin());
}
