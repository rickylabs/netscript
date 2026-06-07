import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module public/features/plugin-list-command
 *
 * `netscript plugin list` command.
 */

import { Command } from '@cliffy/command';
import { loadConfig } from '@netscript/config';
import { AstExtractor, FilesystemWalker } from '@netscript/plugin/sdk';
import { resolve } from '@std/path';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import { loadRegisteredPlugins } from '../../../../kernel/adapters/config/plugin-registry.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { RegisteredPluginConfig } from '../../../../kernel/domain/resolved-config.ts';
import type { ListPluginsInput, PluginListEntry } from './list-plugins-input.ts';

const CONTRIBUTION_AXIS_BY_PLUGIN: Readonly<Record<string, string>> = {
  workers: 'jobs',
  sagas: 'sagas',
  triggers: 'triggers',
};

async function discoverPlugins(projectRoot: string): Promise<readonly PluginListEntry[]> {
  const config = await loadConfig({ cwd: projectRoot });
  const [registeredPlugins, contributionCounts] = await Promise.all([
    loadRegisteredPlugins(projectRoot, config),
    discoverContributionCounts(projectRoot),
  ]);

  return Object.values(registeredPlugins)
    .map((plugin) => toListEntry(plugin, contributionCounts))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function toListEntry(
  plugin: RegisteredPluginConfig,
  contributionCounts: ReadonlyMap<string, number>,
): PluginListEntry {
  const localName = resolvePluginLocalName(plugin.name);
  const contributionAxis = CONTRIBUTION_AXIS_BY_PLUGIN[localName] ?? '-';
  const service = plugin.service?.entrypoint ?? plugin.entrypoints?.main?.path ?? '-';
  return {
    name: plugin.name,
    displayName: plugin.displayName ?? localName,
    type: plugin.type ?? '-',
    enabled: true,
    workdir: plugin.workdir,
    service,
    port: String(plugin.service?.port ?? plugin.infrastructure?.port ?? '-'),
    contributionAxis,
    contributions: contributionAxis === '-' ? 0 : contributionCounts.get(contributionAxis) ?? 0,
  };
}

async function discoverContributionCounts(
  projectRoot: string,
): Promise<ReadonlyMap<string, number>> {
  const files = await new FilesystemWalker().walk(projectRoot);
  const contributions = await new AstExtractor().extract(files);
  const counts = new Map<string, number>();
  for (const contribution of contributions) {
    counts.set(contribution.axis, (counts.get(contribution.axis) ?? 0) + 1);
  }
  return counts;
}

function resolvePluginLocalName(pluginName: string): string {
  const packageSegment = pluginName.split('/').at(-1) ?? pluginName;
  return packageSegment.startsWith('plugin-')
    ? packageSegment.slice('plugin-'.length)
    : packageSegment;
}

/** `netscript plugin list` command. */
export const pluginListCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('list')
  .description('List configured NetScript plugins')
  .option('--project-root <path:string>', 'Project root directory')
  .action(async (flags: ListPluginsInput): Promise<void> => {
    const projectRoot = flags.projectRoot ? resolve(flags.projectRoot) : await findProjectRoot();

    if (!projectRoot) {
      throw new ScaffoldValidationError(
        'Could not find a NetScript project root from the current directory.',
      );
    }

    const plugins = await discoverPlugins(projectRoot);

    if (plugins.length === 0) {
      outputText('No plugins configured.');
      return;
    }

    outputText('Name\tDisplayName\tType\tEnabled\tWorkdir\tService\tPort\tAxis\tContributions');
    for (const plugin of plugins) {
      outputText(
        `${plugin.name}\t${plugin.displayName}\t${plugin.type}\t${plugin.enabled}\t${plugin.workdir}\t${plugin.service}\t${plugin.port}\t${plugin.contributionAxis}\t${plugin.contributions}`,
      );
    }
  });
