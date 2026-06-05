/**
 * @module @netscript/config/loader
 *
 * Configuration file loading and caching utilities.
 */

import { join } from '@std/path';
import { NetScriptConfigSchema } from './src/domain/mod.ts';
import type { LoadConfigOptions, NetScriptConfig } from './types.ts';

/**
 * Supported configuration file names in order of precedence.
 */
const CONFIG_FILES = ['netscript.config.ts', 'netscript.config.js', 'netscript.config.mjs'];

/**
 * Cached configuration instance.
 */
let cachedConfig: NetScriptConfig | null = null;

/**
 * Load and validate a NetScript configuration file.
 *
 * This function searches for configuration files in the following order:
 * 1. Explicit path provided via `options.configFile`
 * 2. `netscript.config.ts` in the working directory
 * 3. `netscript.config.js` in the working directory
 * 4. `netscript.config.mjs` in the working directory
 *
 * @example
 * ```typescript
 * import { loadConfig } from '@netscript/config';
 *
 * // Load from current directory
 * const config = await loadConfig();
 *
 * // Load from specific directory
 * const config = await loadConfig({ cwd: './my-project' });
 *
 * // Load from specific file
 * const config = await loadConfig({ configFile: 'custom.config.ts' });
 * ```
 *
 * @param options - Loading options
 * @returns Validated configuration object
 * @throws Error if no config file found or validation fails
 */
export async function loadConfig(options?: LoadConfigOptions): Promise<NetScriptConfig> {
  // In compiled binaries, NETSCRIPT_PROJECT_ROOT points to the compile-time project root
  // which matches the VFS paths embedded in the binary. Fall back to CWD for development.
  const cwd = options?.cwd ?? Deno.env.get('NETSCRIPT_PROJECT_ROOT') ?? Deno.cwd();

  // If explicit file provided, use it
  if (options?.configFile) {
    // Handle file:// URLs (from import.meta.resolve in compiled binaries)
    if (options.configFile.startsWith('file://')) {
      return loadConfigFile(options.configFile);
    }
    const path = options.configFile.startsWith('/')
      ? options.configFile
      : join(cwd, options.configFile);
    return loadConfigFile(path);
  }

  // Search for config files in order of precedence
  for (const file of CONFIG_FILES) {
    const path = join(cwd, file);
    try {
      const stat = await Deno.stat(path);
      if (stat.isFile) {
        return loadConfigFile(path);
      }
    } catch {
      // File doesn't exist, try next
      continue;
    }
  }

  throw new Error(`No config file found. Create one of: ${CONFIG_FILES.join(', ')}`);
}

/**
 * Load and parse a specific configuration file.
 *
 * @param path - Absolute path to the configuration file
 * @returns Validated configuration object
 */
async function loadConfigFile(path: string): Promise<NetScriptConfig> {
  // If already a file:// URL (from import.meta.resolve), use directly
  // Otherwise convert Windows path to file URL
  const fileUrl = path.startsWith('file://') ? path : `file:///${path.replace(/\\/g, '/')}`;

  const module = await import(fileUrl);
  const config = module.default ?? module;

  // Handle async config functions (from defineConfigAsync)
  const resolved = typeof config === 'function' ? await config() : config;

  // Validate the config
  const validated = NetScriptConfigSchema.parse(resolved);

  return validated;
}

/**
 * Get the cached configuration.
 *
 * This function returns the configuration that was previously loaded
 * via `initConfig()`. Use this for synchronous access after initialization.
 *
 * @example
 * ```typescript
 * import { initConfig, getConfig } from '@netscript/config';
 *
 * // Initialize once at startup
 * await initConfig();
 *
 * // Then access synchronously anywhere
 * const config = getConfig();
 * console.log(config.name);
 * ```
 *
 * @returns Cached configuration object
 * @throws Error if config hasn't been loaded yet
 */
export function getConfig(): NetScriptConfig {
  if (!cachedConfig) {
    throw new Error('Config not loaded. Call initConfig() or loadConfig() first.');
  }
  return cachedConfig;
}

/**
 * Initialize and cache the configuration.
 *
 * Call this once at application startup to load and cache the configuration.
 * After initialization, use `getConfig()` for synchronous access.
 *
 * @example
 * ```typescript
 * import { initConfig, getConfig } from '@netscript/config';
 *
 * // At startup
 * await initConfig();
 *
 * // Later, anywhere in your code
 * const config = getConfig();
 * ```
 *
 * @param options - Loading options
 * @returns Cached configuration object
 */
export async function initConfig(options?: LoadConfigOptions): Promise<NetScriptConfig> {
  cachedConfig = await loadConfig(options);
  return cachedConfig;
}

/**
 * Clear the cached configuration.
 *
 * Useful for testing or when configuration needs to be reloaded.
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

/**
 * Check if configuration has been loaded.
 *
 * @returns True if configuration is cached
 */
export function isConfigLoaded(): boolean {
  return cachedConfig !== null;
}
