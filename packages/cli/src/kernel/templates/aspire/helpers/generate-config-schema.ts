/**
 * @module
 *
 * Generator for `.helpers/config-schema.ts` — a project-specific Zod schema
 * with literal resource name keys enabling type-safe resource map access
 * via `KnownServices<ProjectConfig>`, `KnownPlugins<ProjectConfig>`, etc.
 */

import type { ConfigSchemaOptions } from './types.ts';
import { fileHeader, hasEntries, quoteProperty } from './_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../constants/scaffold/scaffold-aspire.ts';

/**
 * Generates the config-schema.ts file content with narrowed literal keys.
 *
 * Only includes schema sections that have entries — empty sections are
 * omitted entirely (no `z.object({})`).
 *
 * @param options - Resource records from the parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateConfigSchema(options: ConfigSchemaOptions): string {
  const sections: string[] = [];
  const schemaImports = new Set<string>(['NetScriptConfigSchema']);

  // Map each non-empty section to its schema entry type
  const sectionMap: Array<{
    configKey: string;
    entries: Record<string, unknown>;
    schemaName: string;
  }> = [
    { configKey: 'Services', entries: options.services, schemaName: 'ServiceEntrySchema' },
    { configKey: 'Apps', entries: options.apps, schemaName: 'AppEntrySchema' },
    { configKey: 'Plugins', entries: options.plugins, schemaName: 'PluginEntrySchema' },
    {
      configKey: 'BackgroundProcessors',
      entries: options.backgroundProcessors,
      schemaName: 'BackgroundProcessorEntrySchema',
    },
    { configKey: 'Databases', entries: options.databases, schemaName: 'DatabaseEntrySchema' },
    { configKey: 'Cache', entries: options.caches, schemaName: 'CacheEntrySchema' },
    { configKey: 'Tools', entries: options.tools, schemaName: 'ToolEntrySchema' },
  ];

  for (const { configKey, entries, schemaName } of sectionMap) {
    if (!hasEntries(entries)) continue;

    schemaImports.add(schemaName);

    const fields = Object.keys(entries)
      .map((key) => `    ${quoteProperty(key)}: ${schemaName},`)
      .join('\n');

    sections.push(`  ${configKey}: z.object({\n${fields}\n  }),`);
  }

  // Build sorted schema imports
  const sortedImports = [...schemaImports].sort();
  const aspireImport = `import {\n${
    sortedImports.map((i) => `  ${i},`).join('\n')
  }\n} from '${SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT}';`;

  return `${fileHeader('config-schema.ts')}

import { z } from 'zod';
${aspireImport}

/**
 * Project-specific config schema with literal resource name keys.
 * Generated from appsettings.json at \`netscript generate\` time.
 *
 * Enables type-safe resource name inference:
 * \`KnownServices<ProjectConfig>\` resolves to literal union types.
 */
export const ProjectConfigSchema = NetScriptConfigSchema.extend({
${sections.join('\n')}
});

/** Inferred project config type with literal resource name keys. */
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
`;
}
