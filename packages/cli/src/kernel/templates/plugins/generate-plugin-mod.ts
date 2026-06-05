/**
 * @module templates/plugins/generate-plugin-mod
 *
 * Tier 1 generator for a scaffolded plugin manifest (`mod.ts`).
 */

import { toPascalCase } from '@std/text';

import type { PluginKindProvider, PluginScaffoldOptions } from '../../domain/plugin-kind.ts';

/** Options accepted by manifest generators for scaffolded plugins. */
export type PluginManifestOptions =
  & Pick<PluginScaffoldOptions, 'pluginName'>
  & {
    readonly port: number;
    readonly servicePort: number;
    readonly requiresDb: boolean;
    readonly includeSamples: boolean;
  };

function descriptionForKind(provider: PluginKindProvider): string {
  return `${provider.displayName} plugin`;
}

function renderArrayLiteral(values: readonly string[], indent = 2): string {
  if (values.length === 0) {
    return '[]';
  }

  const padding = ' '.repeat(indent);
  const innerPadding = ' '.repeat(indent + 2);
  const lines = values.map((value) => `${innerPadding}'${value}',`);
  return `[\n${lines.join('\n')}\n${padding}]`;
}

/** Generate `plugins/<name>/mod.ts`. */
export function generatePluginMod(
  provider: PluginKindProvider,
  options: PluginManifestOptions,
): string {
  const pascalName = toPascalCase(options.pluginName);
  const displayName = pascalName;
  const lines: string[] = [];

  lines.push('/**');
  lines.push(` * ${pascalName} plugin manifest.`);
  lines.push(' */');
  lines.push('');
  lines.push("import { definePlugin } from '@netscript/plugin';");
  lines.push('');
  lines.push(`export const ${pascalName}Plugin = definePlugin('${options.pluginName}', '0.1.0')`);
  lines.push(`  .withDisplayName('${displayName}')`);
  lines.push(`  .withType('${provider.pluginType}')`);
  lines.push(`  .withDescription('${descriptionForKind(provider)}')`);
  lines.push(`  .withPermissions(${renderArrayLiteral(provider.defaultPermissions, 4)})`);
  lines.push('  .withService({');
  lines.push(`    name: '${options.pluginName}-api',`);
  lines.push(`    entrypoint: './${provider.defaultServiceEntrypoint}',`);
  lines.push(`    port: ${options.servicePort},`);
  lines.push('  })');
  if (provider.supportsConcurrency && provider.defaultConcurrency) {
    lines.push('  .withBackgroundProcessor({');
    lines.push(`    name: '${options.pluginName}',`);
    lines.push(`    entrypoint: './${provider.defaultEntrypoint}',`);
    lines.push(`    concurrency: ${provider.defaultConcurrency},`);
    lines.push('  })');
  }
  if (options.requiresDb) {
    lines.push("  .withDbSchemas([{ path: './database/schema.prisma', engine: 'postgres' }])");
  }
  lines.push("  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])");
  lines.push('  .withHooks({');
  lines.push('    setup: async (ctx): Promise<void> => {');
  lines.push(`      ctx.logger.info('${options.pluginName} plugin loaded');`);
  lines.push('    },');
  lines.push('    teardown: async (ctx): Promise<void> => {');
  lines.push(`      ctx.logger.info('${options.pluginName} plugin unloaded');`);
  lines.push('    },');
  lines.push('  })');
  lines.push('  .build();');

  return `${lines.join('\n')}\n`;
}
