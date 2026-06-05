/**
 * @module @netscript/config/env
 *
 * Environment variable resolution with type coercion.
 */

import type { EnvDef, ResolvedEnvType } from './types.ts';

/**
 * Resolve environment variables with type coercion and defaults.
 *
 * This function provides a type-safe way to access environment variables
 * with automatic type coercion for numbers, booleans, and JSON.
 *
 * @example
 * ```typescript
 * import { resolveEnv } from '@netscript/config';
 *
 * const env = resolveEnv({
 *   PORT: { type: 'number', default: 3000 },
 *   DEBUG: { type: 'boolean', default: false },
 *   DATABASE_URL: { env: 'DB_URL', required: true },
 *   CONFIG: { type: 'json', default: {} },
 * });
 *
 * // env.PORT is number
 * // env.DEBUG is boolean
 * // env.DATABASE_URL is string
 * // env.CONFIG is unknown (parsed JSON)
 * ```
 *
 * @param schema - Object defining environment variables to resolve
 * @returns Object with resolved and typed values
 * @throws Error if a required variable is missing
 */
export function resolveEnv<T extends Record<string, EnvDef>>(
  schema: T,
): { [K in keyof T]: ResolvedEnvType<T[K]> } {
  const result: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(schema)) {
    const envKey = def.env ?? key;
    const rawValue = Deno.env.get(envKey);

    if (rawValue === undefined) {
      if (def.required && def.default === undefined) {
        throw new Error(`Required environment variable ${envKey} is not set`);
      }
      result[key] = def.default;
      continue;
    }

    // Type coercion
    switch (def.type) {
      case 'number': {
        const parsed = Number(rawValue);
        if (isNaN(parsed)) {
          throw new Error(`Environment variable ${envKey} is not a valid number: ${rawValue}`);
        }
        result[key] = parsed;
        break;
      }
      case 'boolean':
        result[key] = rawValue === 'true' || rawValue === '1' || rawValue === 'yes';
        break;
      case 'json':
        try {
          result[key] = JSON.parse(rawValue);
        } catch {
          throw new Error(`Environment variable ${envKey} is not valid JSON: ${rawValue}`);
        }
        break;
      default:
        result[key] = rawValue;
    }
  }

  return result as { [K in keyof T]: ResolvedEnvType<T[K]> };
}

/**
 * Get a single environment variable with type coercion.
 *
 * @example
 * ```typescript
 * import { getEnv } from '@netscript/config';
 *
 * const port = getEnv('PORT', { type: 'number', default: 3000 });
 * const debug = getEnv('DEBUG', { type: 'boolean', default: false });
 * const dbUrl = getEnv('DATABASE_URL', { required: true });
 * ```
 *
 * @param name - Environment variable name
 * @param options - Resolution options
 * @returns Resolved and typed value
 */
export function getEnv<T extends EnvDef>(name: string, options?: T): ResolvedEnvType<T> {
  const result = resolveEnv({ [name]: options ?? {} });
  return result[name] as ResolvedEnvType<T>;
}

/**
 * Check if an environment variable is set.
 *
 * @param name - Environment variable name
 * @returns True if the variable is set (even if empty string)
 */
export function hasEnv(name: string): boolean {
  return Deno.env.get(name) !== undefined;
}

/**
 * Get the current environment mode.
 *
 * Checks `DENO_ENV` and `NODE_ENV` environment variables.
 *
 * @returns Current environment mode
 */
export function getMode(): 'development' | 'production' | 'test' {
  const mode = Deno.env.get('DENO_ENV') ?? Deno.env.get('NODE_ENV') ?? 'development';
  if (mode === 'production' || mode === 'test') {
    return mode;
  }
  return 'development';
}

/**
 * Check if running in development mode.
 */
export function isDev(): boolean {
  return getMode() === 'development';
}

/**
 * Check if running in production mode.
 */
export function isProd(): boolean {
  return getMode() === 'production';
}

/**
 * Check if running in test mode.
 */
export function isTest(): boolean {
  return getMode() === 'test';
}
