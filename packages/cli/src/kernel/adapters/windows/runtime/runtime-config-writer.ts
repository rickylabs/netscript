/** Write Windows runtime override scaffolding for deploy output. */
import { join } from '@std/path';
import { RUNTIME_CONFIG_FILES, RUNTIME_TOPICS } from '../../../constants/runtime.ts';
import type { NetScriptConfig } from '@netscript/config';
import type { RuntimeVersionPointer } from '../../../domain/deploy/runtime-overrides.ts';
import type {
  PluginRuntimeContribution,
  PluginRuntimeSchemaEntry,
} from './runtime-config-schema-types.ts';
import {
  DEFAULT_FEATURE_FLAGS,
  generateJobOverrides,
  generateSagaOverrides,
  generateTriggerOverrides,
} from './runtime-config-overrides.ts';
import { generateRuntimeSchema } from './runtime-config-schema.ts';

// ============================================================================
// WRITER
// ============================================================================

/**
 * Generate and write all runtime config files to the deploy output directory.
 *
 * Skips overwriting existing files that may have been manually edited by operators.
 * Plugin topics are written after built-in topics and merged into the `current` pointer
 * so binaries can discover them without any core changes.
 *
 * @param netscriptConfig - Validated netscript.config.ts
 * @param configDir - Absolute path to .deploy/windows/config/
 * @param version - Application version string
 * @param force - Overwrite existing files (default: false)
 * @param plugins - Optional plugin topics to generate alongside built-in topics
 * @param pluginSchemas - Optional plugin-defined schema entries (from runtimeConfig.schemas)
 * @returns Array of written file paths
 */
export async function writeRuntimeConfig(
  netscriptConfig: NetScriptConfig,
  configDir: string,
  version: string,
  force = false,
  plugins: PluginRuntimeContribution[] = [],
  pluginSchemas: PluginRuntimeSchemaEntry[] = [],
): Promise<string[]> {
  const runtimeDir = join(configDir, 'runtime');
  await Deno.mkdir(runtimeDir, { recursive: true });

  const written: string[] = [];
  const versionFileName = `v${version}.json`;

  /**
   * Write a file only if it does not exist (unless force is set).
   */
  async function writeIfNew(path: string, content: string): Promise<void> {
    if (!force) {
      try {
        await Deno.stat(path);
        return; // Already exists — do not overwrite operator edits
      } catch { /* does not exist — safe to write */ }
    }
    await Deno.writeTextFile(path, content);
    written.push(path);
  }

  // schema.json (always regenerate — structural, not operator data)
  // When pluginSchemas are provided, their definitions override the hardcoded
  // fallbacks so the deploy schema stays in sync with the plugin source of truth.
  const schemaPath = join(runtimeDir, RUNTIME_CONFIG_FILES.SCHEMA);
  await Deno.writeTextFile(
    schemaPath,
    JSON.stringify(generateRuntimeSchema(plugins, pluginSchemas), null, 2),
  );
  written.push(schemaPath);

  // Per-topic subdirectories and version files
  const jobOverrides = generateJobOverrides(netscriptConfig);
  const sagaOverrides = generateSagaOverrides(netscriptConfig);
  const triggerOverrides = generateTriggerOverrides(netscriptConfig);
  const topics: Array<{ dir: string; file: string; content: unknown }> = [
    {
      dir: join(runtimeDir, RUNTIME_TOPICS.JOBS),
      file: versionFileName,
      content: {
        $schema: `../schema.json`,
        version,
        overrides: jobOverrides,
      },
    },
    {
      dir: join(runtimeDir, RUNTIME_TOPICS.SAGAS),
      file: versionFileName,
      content: {
        $schema: `../schema.json`,
        version,
        overrides: sagaOverrides,
      },
    },
    {
      dir: join(runtimeDir, RUNTIME_TOPICS.TASKS),
      file: versionFileName,
      content: {
        $schema: `../schema.json`,
        version,
        tasks: [],
      },
    },
    {
      dir: join(runtimeDir, RUNTIME_TOPICS.TRIGGERS),
      file: versionFileName,
      content: {
        $schema: `../schema.json`,
        version,
        overrides: triggerOverrides,
      },
    },
    {
      dir: join(runtimeDir, RUNTIME_TOPICS.FEATURES),
      file: versionFileName,
      content: {
        $schema: `../schema.json`,
        version,
        flags: DEFAULT_FEATURE_FLAGS,
      },
    },
  ];

  for (const { dir, file, content } of topics) {
    await Deno.mkdir(dir, { recursive: true });
    await writeIfNew(join(dir, file), JSON.stringify(content, null, 2));
  }

  // Plugin topics — generated after built-ins, merged into pointer
  const pluginPointerEntries: Record<string, string> = {};
  const pluginConfigInput: Record<string, unknown> = { ...netscriptConfig };
  for (const plugin of plugins) {
    const pluginDir = join(runtimeDir, plugin.topic);
    await Deno.mkdir(pluginDir, { recursive: true });
    const pluginContent = plugin.generate(pluginConfigInput);
    await writeIfNew(join(pluginDir, versionFileName), JSON.stringify(pluginContent, null, 2));
    pluginPointerEntries[plugin.topic] = `${plugin.topic}/${versionFileName}`;
  }

  // current pointer (always update to point to latest version files)
  // Uses index signature to allow plugin topic keys alongside typed built-in keys.
  const pointer: RuntimeVersionPointer & Record<string, string> = {
    version,
    jobs: `${RUNTIME_TOPICS.JOBS}/${versionFileName}`,
    sagas: `${RUNTIME_TOPICS.SAGAS}/${versionFileName}`,
    tasks: `${RUNTIME_TOPICS.TASKS}/${versionFileName}`,
    triggers: `${RUNTIME_TOPICS.TRIGGERS}/${versionFileName}`,
    features: `${RUNTIME_TOPICS.FEATURES}/${versionFileName}`,
    updatedAt: new Date().toISOString(),
    ...pluginPointerEntries,
  };

  const currentPath = join(runtimeDir, RUNTIME_CONFIG_FILES.CURRENT);
  await Deno.writeTextFile(currentPath, JSON.stringify(pointer, null, 2));
  written.push(currentPath);

  return written;
}
