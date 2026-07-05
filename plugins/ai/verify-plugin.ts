/**
 * Manifest verification for `@netscript/plugin-ai`.
 *
 * @module
 */

import {
  type PluginVerificationResult,
  runPluginVerificationCli,
  verifyPlugin,
} from '@netscript/plugin';
import { aiPlugin } from './mod.ts';
import denoJson from './deno.json' with { type: 'json' };

/** Verify that the AI plugin manifest exposes the expected thin contribution axes. */
export function verifyAiPlugin(): PluginVerificationResult {
  return verifyPlugin(aiPlugin, {
    name: '@netscript/plugin-ai',
    version: denoJson.version,
    contractVersions: [{
      version: 'v1',
      loader: './contracts/v1/mod.ts',
      message: 'expected the AI v1 contract contribution',
    }],
    runtimeConfigTopics: [{
      name: 'ai',
      message: 'expected the AI runtime config topic contribution',
    }],
  });
}

if (import.meta.main) {
  runPluginVerificationCli(verifyAiPlugin());
}
