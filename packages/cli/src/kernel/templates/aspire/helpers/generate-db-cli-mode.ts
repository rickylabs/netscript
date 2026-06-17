/**
 * @module templates/aspire/helpers/generate-db-cli-mode
 *
 * Generator for `.helpers/db-cli-mode.mts`, the AppHost short-circuit used by
 * `netscript db <operation>` commands.
 */

import type { DbCliModeOptions } from './types.ts';
import { fileHeader } from './_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../constants/scaffold/scaffold-aspire.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';

/** Generate DB CLI mode helper source. */
export function generateDbCliMode(options: DbCliModeOptions): string {
  const dbEntries = Object.entries(options.databases);
  const targetCases = dbEntries.map(([name, entry]) => {
    const databaseName = entry.DatabaseName ?? name;
    return `    '${name}': {
      configKey: '${name}',
      resourceKey: '${name}',
      databaseName: '${databaseName}',
      envKey: '${toEnvPrefix(name)}_URI',
      engine: '${entry.Engine}',
      taskSuffix: '${engineTaskSuffix(entry.Engine)}',
      workdir: resolve(appHostDir, 'database', '${engineDir(entry.Engine)}'),
      resource: infrastructure.databases.get('${name}') ?? null,
    }`;
  });

  const targets = targetCases.length > 0 ? targetCases.join(',\n') : '';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateDbCliMode1, {
    __slot0__: String(fileHeader('db-cli-mode.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot3__: String(targets),
  });
}

function engineTaskSuffix(engine: string): string {
  switch (engine) {
    case 'Postgres':
      return 'postgres';
    case 'Mysql':
      return 'mysql';
    case 'Mssql':
      return 'mssql';
    case 'Sqlite':
      return 'sqlite';
    default:
      return engine.toLowerCase();
  }
}

function engineDir(engine: string): string {
  return engineTaskSuffix(engine);
}

function toEnvPrefix(configKey: string): string {
  return configKey.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toUpperCase();
}
