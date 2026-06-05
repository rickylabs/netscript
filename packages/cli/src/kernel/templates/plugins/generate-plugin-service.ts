/**
 * @module templates/plugins/generate-plugin-service
 *
 * Tier 1 generators for scaffolded plugin service/runtime files.
 */

import { toCamelCase, toPascalCase } from '@std/text';

import type { PluginKindProvider, PluginScaffoldOptions } from '../../domain/plugin-kind.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/** Options accepted by code-generation helpers for plugin service files. */
export type PluginCodeOptions =
  & Pick<PluginScaffoldOptions, 'pluginName' | 'kind'>
  & { readonly servicePort: number };

function contractImportPath(provider: PluginKindProvider): string {
  return provider.category === 'plugin' ? '../contracts/v1/mod.ts' : '../../contracts/v1/mod.ts';
}

/** Generate the service entrypoint (`src/main.ts` or `services/src/main.ts`). */
export function generatePluginService(
  provider: PluginKindProvider,
  options: PluginCodeOptions,
): string {
  const pascalName = toPascalCase(options.pluginName);
  const displayName = pascalName;
  const kvAdapterImportBlock = provider.defaultRequiresKv
    ? `import '@netscript/kv/redis';
`
    : '';
  const dbClientTypeBlock = provider.defaultRequiresDb
    ? `
type ServiceDatabaseClient = Record<string, unknown>;
`
    : '';
  const dbClientLoadBlock = provider.defaultRequiresDb
    ? `  const dbClient = await ctx.db.getClient() as ServiceDatabaseClient;
`
    : '';
  const dbBuilderBlock = provider.defaultRequiresDb
    ? `
  builder.withDatabase(dbClient);
`
    : '';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedPluginsGeneratePluginService1, {
    __slot0__: String(pascalName),
    __slot1__: String(`${kvAdapterImportBlock}${dbClientTypeBlock}`),
    __slot2__: String(pascalName),
    __slot3__: String(options.servicePort),
    __slot4__: String(dbClientLoadBlock),
    __slot5__: String(options.pluginName),
    __slot6__: String(displayName),
    __slot7__: String(provider.kind),
    __slot8__: String(options.pluginName),
    __slot9__: String(dbBuilderBlock),
    __slot10__: String(pascalName),
    __slot11__: String(options.pluginName),
    __slot12__: String(options.pluginName),
    __slot13__: String(pascalName),
    __slot14__: String(pascalName),
  });
}

/** Generate the oRPC router stub for a scaffolded plugin service. */
export function generatePluginRouter(
  provider: PluginKindProvider,
  options: PluginCodeOptions,
): string {
  const camelName = toCamelCase(options.pluginName);
  const pascalName = toPascalCase(options.pluginName);
  const importPath = contractImportPath(provider);

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedPluginsGeneratePluginService2, {
    __slot0__: String(pascalName),
    __slot1__: String(importPath),
    __slot2__: String(camelName),
    __slot3__: String(camelName),
    __slot4__: String(options.pluginName),
    __slot5__: String(options.kind),
    __slot6__: String(camelName),
    __slot7__: String(camelName),
  });
}

/**
 * Generate the background processor runtime entrypoint (`bin/combined.ts`).
 *
 * API plugins do not use this file.
 */
export function generatePluginProcessorEntrypoint(
  provider: PluginKindProvider,
  options: PluginCodeOptions,
): string {
  if (!provider.supportsConcurrency || !provider.concurrencyEnvVar) {
    throw new Error(
      `Plugin kind "${provider.kind}" does not define a background processor entrypoint.`,
    );
  }

  const pascalName = toPascalCase(options.pluginName);

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedPluginsGeneratePluginService3, {
    __slot0__: String(pascalName),
    __slot1__: String(provider.concurrencyEnvVar),
    __slot2__: String(provider.defaultConcurrency ?? 1),
    __slot3__: String(options.pluginName),
    __slot4__: String(provider.kind),
    __slot5__: String(options.pluginName),
    __slot6__: String(options.pluginName),
  });
}
