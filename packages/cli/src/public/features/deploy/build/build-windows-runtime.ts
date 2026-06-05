import {
  outputText,
  outputWarning,
} from '../../../../kernel/presentation/output/default-output.ts';
import { gray, green, yellow } from '@std/fmt/colors';
import { join } from '@std/path';
import { RUNTIME_TOPICS } from '../../../../kernel/constants/runtime.ts';
import type { ResolvedConfig } from '../../../../kernel/domain/resolved-config.ts';
import type {
  PluginRuntimeContribution,
  PluginRuntimeSchemaEntry,
} from '../../../../kernel/adapters/windows/runtime/runtime-config-schema-types.ts';
import { writeRuntimeConfig } from '../../../../kernel/adapters/windows/runtime/runtime-config-writer.ts';
import {
  resolveAllVersionConflicts,
  type VersionConflictOptions,
} from '../../../../kernel/adapters/windows/runtime/runtime-version.ts';
import type { WindowsBuildOptions } from './build-windows-options.ts';

const RUNTIME_PATH_TOPIC_MAP: Record<string, string[]> = {
  workers: [RUNTIME_TOPICS.JOBS, RUNTIME_TOPICS.TASKS, RUNTIME_TOPICS.FEATURES],
  sagas: [RUNTIME_TOPICS.SAGAS],
  triggers: [RUNTIME_TOPICS.TRIGGERS],
};

export async function writeWindowsRuntimeConfig(
  config: ResolvedConfig,
  options: WindowsBuildOptions,
  configDir: string,
): Promise<void> {
  // ── Step 4: Runtime config scaffolding ───────────────────────────────────
  outputText('⚙️  Generating runtime configuration...');

  // Collect runtime contributions from active plugins.
  // Two types of contributions are collected:
  //   1. `runtime` (PluginRuntimeContribution) — custom topic directories
  //   2. `runtimeConfig.schemas` (PluginRuntimeSchemaEntry[]) — JSON Schema
  //      definitions for built-in topics, so the deploy schema.json is
  //      generated from plugin code rather than hardcoded fallbacks.
  // Errors during plugin load are non-fatal — the plugin is skipped with a warning.
  const pluginContributions: PluginRuntimeContribution[] = [];
  const pluginSchemas: PluginRuntimeSchemaEntry[] = [];
  for (const plugin of Object.values(config.registeredPlugins)) {
    const isEnabled = plugin.type === 'background-processor'
      ? (config.backgroundProcessors[plugin.name]?.enabled ?? false)
      : Boolean(plugin.service && config.plugins[`${plugin.name}-api`]?.enabled);

    if (!isEnabled) continue;

    const contribution = plugin.runtime;
    if (contribution?.generatedContent) {
      pluginContributions.push({
        topic: contribution.topic,
        description: contribution.description,
        schemaDefinitions: contribution.schemaDefinitions,
        generate: () => contribution.generatedContent ?? {},
      });
      if (options.verbose) {
        outputText(
          `   ${
            gray('→')
          } plugin '${plugin.name}' contributes runtime topic '${contribution.topic}'`,
        );
      }
    }

    const schemas = plugin.runtimeConfig?.schemas;
    if (schemas) {
      for (const entry of schemas) {
        pluginSchemas.push({ ...entry, pluginName: plugin.name });
      }
      if (options.verbose) {
        outputText(
          `   ${gray('→')} plugin '${plugin.name}' contributes schema(s): ${
            schemas.map((s) => s.topic).join(', ')
          }`,
        );
      }
    }
  }

  const runtimeFiles = await writeRuntimeConfig(
    config.netscriptConfig,
    configDir,
    config.version,
    options.forceRuntimeConfig,
    pluginContributions,
    pluginSchemas,
  );
  outputText(`   ${green('✓')} Generated ${runtimeFiles.length} runtime config files`);

  // Merge dev-time runtime config files into the deploy output.
  // netscript.config.ts declares `runtimeConfig.paths` by schema-owner topic
  // (e.g. workers → ./workers/runtime). Some schema owners fan out to multiple
  // runtime directories: workers owns jobs/tasks/features.
  //
  // Version conflict resolution (4 cases):
  //   1. No existing output → write initial version
  //   2. Same version → prompt (or --keep-runtime=local|remote, --ci skips)
  //   3. Remote newer → skip (or --fail-on-drift fails the build)
  //   4. Local newer → prompt to confirm override (--ci defaults to yes)
  const runtimePaths = (config.netscriptConfig.runtimeConfig?.paths ?? {}) as Record<
    string,
    { configDir?: string }
  >;
  const deployRuntimeDir = join(configDir, 'runtime');
  let mergedTopicFiles = 0;
  let skippedTopicFiles = 0;

  const versionConflictOptions: VersionConflictOptions = {
    ci: options.ci ?? false,
    force: options.forceRuntimeConfig ?? false,
    failOnDrift: options.failOnDrift ?? false,
    keepRuntime: options.keepRuntime,
    verbose: options.verbose ?? false,
  };

  for (const [topic, entry] of Object.entries(runtimePaths)) {
    if (!entry.configDir) continue;
    const devConfigDir = join(config.projectRoot, entry.configDir);
    const runtimeTopics = RUNTIME_PATH_TOPIC_MAP[topic] ?? [topic];

    // Resolve version conflicts once per runtime topic owned by this config path.
    const conflictResult = await resolveAllVersionConflicts(
      runtimeTopics,
      config.version,
      deployRuntimeDir,
      versionConflictOptions,
    );

    for (const runtimeTopic of runtimeTopics) {
      // Look for the runtime topic subdirectory (e.g., workers/runtime/jobs/).
      const devTopicDir = join(devConfigDir, runtimeTopic);
      try {
        const stat = await Deno.stat(devTopicDir);
        if (!stat.isDirectory) continue;
      } catch {
        // Dev topic dir doesn't exist — skip (operator hasn't created config files yet)
        continue;
      }

      const topicResult = conflictResult.get(runtimeTopic);
      if (topicResult && topicResult.resolution === 'skip') {
        if (options.verbose) {
          outputText(
            `   ${gray('→')} skipped topic ${runtimeTopic}: ${topicResult.reason}`,
          );
        }
        skippedTopicFiles++;
        continue;
      }

      // Copy versioned JSON files from dev topic dir into deploy runtime topic dir.
      const deployTopicDir = join(deployRuntimeDir, runtimeTopic);
      await Deno.mkdir(deployTopicDir, { recursive: true });

      for await (const file of Deno.readDir(devTopicDir)) {
        if (!file.isFile || !file.name.endsWith('.json')) continue;
        const srcPath = join(devTopicDir, file.name);
        const dstPath = join(deployTopicDir, file.name);

        try {
          await Deno.copyFile(srcPath, dstPath);
          mergedTopicFiles++;
          if (options.verbose) {
            outputText(`   ${gray('→')} merged ${runtimeTopic}/${file.name} from dev config`);
          }
        } catch (err) {
          outputWarning(
            `   ${yellow('⚠')} Failed to merge ${runtimeTopic}/${file.name}: ${
              (err as Error).message
            }`,
          );
        }
      }
    }

    // Also update the current pointer to reference the dev-time version file
    // if one exists and differs from the generated pointer
    const devCurrentPath = join(devConfigDir, 'current');
    try {
      const devCurrentText = (await Deno.readTextFile(devCurrentPath)).trim();
      if (devCurrentText) {
        let devPointer: Record<string, string>;
        try {
          devPointer = JSON.parse(devCurrentText);
        } catch {
          // Plain-text version string — derive topic paths for all owned runtime topics.
          const version = devCurrentText;
          devPointer = Object.fromEntries(
            runtimeTopics.map((runtimeTopic) => [runtimeTopic, `${runtimeTopic}/v${version}.json`]),
          );
        }

        const pointerUpdates = runtimeTopics.filter((runtimeTopic) => devPointer[runtimeTopic]);

        if (pointerUpdates.length > 0) {
          const deployCurrentPath = join(deployRuntimeDir, 'current');
          try {
            const deployCurrentText = await Deno.readTextFile(deployCurrentPath);
            const deployPointer = JSON.parse(deployCurrentText);
            for (const runtimeTopic of pointerUpdates) {
              deployPointer[runtimeTopic] = devPointer[runtimeTopic];
            }
            deployPointer.updatedAt = new Date().toISOString();
            await Deno.writeTextFile(deployCurrentPath, JSON.stringify(deployPointer, null, 2));
          } catch {
            // Deploy current doesn't exist yet or is malformed — skip pointer merge
          }
        }
      }
    } catch {
      // No dev current pointer — skip
    }
  }

  if (mergedTopicFiles > 0) {
    outputText(`   ${green('✓')} Merged ${mergedTopicFiles} dev-time runtime config file(s)`);
  }
  if (skippedTopicFiles > 0) {
    outputText(
      `   ${gray('→')} Skipped ${skippedTopicFiles} file(s) (version conflict resolution)`,
    );
  }
  outputText('');
}
