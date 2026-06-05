/**
 * @module templates/plugins/generate-plugin-samples
 *
 * Tier 1 generators for optional plugin sample jobs and tasks.
 */

import { toPascalCase } from '@std/text';

import type { PluginKindProvider, PluginScaffoldOptions } from '../../domain/plugin-kind.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/** Options accepted by sample-file generators for scaffolded plugins. */
export type PluginSampleOptions = Pick<PluginScaffoldOptions, 'pluginName' | 'kind'>;

/** Generated sample file descriptor. */
export interface PluginSampleFile {
  /** Path relative to the plugin workspace root. */
  readonly path: string;
  /** File content. */
  readonly content: string;
}

/** Generate optional sample source files for a scaffolded plugin. */
export function generatePluginSampleFiles(
  provider: PluginKindProvider,
  options: PluginSampleOptions,
): readonly PluginSampleFile[] {
  if (provider.category !== 'background-processor') {
    return [];
  }

  const files: PluginSampleFile[] = [
    {
      path: 'jobs/health-check.ts',
      content: generateSampleJob(options),
    },
    {
      path: 'tasks/validate-payload.ts',
      content: generateSampleTask(options),
    },
  ];

  return files;
}

/** Generate manifest contribution blocks for optional samples. */
export function generatePluginSampleManifestBlocks(
  provider: PluginKindProvider,
  options: Pick<PluginScaffoldOptions, 'pluginName'>,
): readonly string[] {
  void provider;
  void options;
  return [];
}

function generateSampleJob(options: PluginSampleOptions): string {
  const pascalName = toPascalCase(options.pluginName);
  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedPluginsGeneratePluginSamples1, {
    __slot0__: String(pascalName),
    __slot1__: String(options.pluginName),
    __slot2__: String(options.pluginName),
    __slot3__: String(options.pluginName),
    __slot4__: String(options.pluginName),
    __slot5__: String(options.pluginName),
  });
}

function generateSampleTask(options: PluginSampleOptions): string {
  const pascalName = toPascalCase(options.pluginName);
  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedPluginsGeneratePluginSamples2, {
    __slot0__: String(pascalName),
    __slot1__: String(options.pluginName),
  });
}
