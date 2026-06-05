/**
 * @module @netscript/config/define-config
 *
 * Type-safe configuration definition helpers inspired by Vite's defineConfig pattern.
 */

import { NetScriptConfigSchema } from './src/domain/mod.ts';
import type { ConfigEnv, NetScriptConfig, NetScriptConfigInput } from './types.ts';

/**
 * Type-safe configuration definition with validation.
 *
 * Use this function to define your NetScript configuration with full
 * TypeScript type inference and runtime validation.
 *
 * @example
 * ```typescript
 * // netscript.config.ts
 * import { defineConfig } from '@netscript/config';
 *
 * export default defineConfig({
 *   name: 'my-app',
 *   version: '1.0.0',
 *   services: {
 *     users: { port: 3000 },
 *     products: { port: 3001 },
 *   },
 * });
 * ```
 *
 * @param config - The configuration object
 * @returns Validated configuration object
 */
export function defineConfig(config: NetScriptConfigInput): NetScriptConfig {
  return NetScriptConfigSchema.parse(config);
}

/**
 * Type-safe configuration definition for async/environment-based configurations.
 *
 * Use this function when you need to conditionally configure based on
 * the environment mode (development, production, test) or the CLI command.
 *
 * @example
 * ```typescript
 * // netscript.config.ts
 * import { defineConfigAsync } from '@netscript/config';
 *
 * export default defineConfigAsync(async ({ mode, command }) => {
 *   const isDev = mode === 'development';
 *
 *   return {
 *     name: 'my-app',
 *     logging: {
 *       level: isDev ? 'debug' : 'info',
 *       format: isDev ? 'text' : 'json',
 *     },
 *     services: {
 *       users: { port: isDev ? 3000 : 80 },
 *     },
 *   };
 * });
 * ```
 *
 * @param configFn - Async function that receives env context and returns config
 * @returns Async function that resolves to validated configuration
 */
export function defineConfigAsync(
  configFn: (env: ConfigEnv) => NetScriptConfigInput | Promise<NetScriptConfigInput>,
): () => Promise<NetScriptConfig> {
  return async () => {
    const env: ConfigEnv = {
      mode: (Deno.env.get('DENO_ENV') as ConfigEnv['mode']) ?? 'development',
      command: Deno.args[0] ?? 'dev',
    };
    const config = await configFn(env);
    return NetScriptConfigSchema.parse(config);
  };
}
