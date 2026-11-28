/**
 * @module
 *
 * Generator for `.helpers/config-schema.mts` — a project-specific Zod schema
 * with literal resource name keys enabling type-safe resource map access
 * via `KnownServices<ProjectConfig>`, `KnownPlugins<ProjectConfig>`, etc.
 */

import type { ConfigSchemaOptions } from './types.ts';
import { fileHeader, hasEntries, quoteProperty } from './_utils.ts';

interface SectionDescriptor {
  readonly configKey: string;
  readonly entries: Record<string, unknown>;
  readonly schemaName: string;
  readonly typeName: string;
}

/**
 * Generates the config-schema.mts file content with narrowed literal keys.
 *
 * Wraps the canonical `@netscript/aspire/config` `AspireSchema<T>` exports via
 * `asZodSchema<T>` and narrows populated sections through `.pipe(z.looseObject(...))`
 * with an explicit `ProjectConfig` intersection type.
 *
 * @param options - Resource records from the parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateConfigSchema(options: ConfigSchemaOptions): string {
  const sections: string[] = [];
  const typeOverrides: string[] = [];
  const narrowedKeys: string[] = [];
  const schemaImports = new Set<string>(['type AspireSchema', 'NetScriptConfigSchema']);
  const typeImports = new Set<string>(['NetScriptConfig']);

  const sectionMap: readonly SectionDescriptor[] = [
    {
      configKey: 'Services',
      entries: options.services,
      schemaName: 'ServiceEntrySchema',
      typeName: 'ServiceEntry',
    },
    {
      configKey: 'Apps',
      entries: options.apps,
      schemaName: 'AppEntrySchema',
      typeName: 'AppEntry',
    },
    {
      configKey: 'Plugins',
      entries: options.plugins,
      schemaName: 'PluginEntrySchema',
      typeName: 'PluginEntry',
    },
    {
      configKey: 'BackgroundProcessors',
      entries: options.backgroundProcessors,
      schemaName: 'BackgroundProcessorEntrySchema',
      typeName: 'BackgroundProcessorEntry',
    },
    {
      configKey: 'Databases',
      entries: options.databases,
      schemaName: 'DatabaseEntrySchema',
      typeName: 'DatabaseEntry',
    },
    {
      configKey: 'Cache',
      entries: options.caches,
      schemaName: 'CacheEntrySchema',
      typeName: 'CacheEntry',
    },
    {
      configKey: 'Tools',
      entries: options.tools,
      schemaName: 'ToolEntrySchema',
      typeName: 'ToolEntry',
    },
  ];

  for (const { configKey, entries, schemaName, typeName } of sectionMap) {
    if (!hasEntries(entries)) continue;

    schemaImports.add(schemaName);
    typeImports.add(typeName);
    narrowedKeys.push(`'${configKey}'`);

    const fields = Object.keys(entries)
      .map((key) => `    ${quoteProperty(key)}: asZodSchema(${schemaName}),`)
      .join('\n');
    sections.push(`  ${configKey}: z.object({\n${fields}\n  }),`);

    const typeFields = Object.keys(entries)
      .map((key) => `    readonly ${quoteProperty(key)}: ${typeName};`)
      .join('\n');
    typeOverrides.push(`  readonly ${configKey}: {\n${typeFields}\n  };`);
  }

  const sortedSchemaImports = [...schemaImports].sort();
  const sortedTypeImports = [...typeImports].sort();
  const configImport = `import {\n${
    sortedSchemaImports.map((item) => `  ${item},`).join('\n')
  }\n} from '@netscript/aspire/config';`;
  const typesImport = `import type {\n${
    sortedTypeImports.map((item) => `  ${item},`).join('\n')
  }\n} from '@netscript/aspire/types';`;

  const narrowedSectionBlock = sections.length > 0
    ? `const narrowedSectionsSchema = z.looseObject({\n${sections.join('\n')}\n});\n\n`
    : '';
  const schemaExpression = sections.length > 0
    ? `asZodSchema(NetScriptConfigSchema).transform(\n  (value, ctx): ProjectConfig => {\n    const parsed = narrowedSectionsSchema.safeParse(value);\n    if (!parsed.success) {\n      for (const issue of parsed.error.issues) {\n        ctx.addIssue({\n          code: 'custom',\n          path: issue.path,\n          message: issue.message,\n        });\n      }\n      return z.NEVER;\n    }\n    return parsed.data as ProjectConfig;\n  },\n)`
    : `asZodSchema(NetScriptConfigSchema)`;

  const projectConfigType = narrowedKeys.length > 0
    ? `Omit<NetScriptConfig, ${narrowedKeys.join(' | ')}> & {\n${typeOverrides.join('\n')}\n}`
    : 'NetScriptConfig';

  return `${fileHeader('config-schema.mts')}

import { z } from 'zod';
${configImport}
${typesImport}

function asZodSchema<T>(schema: AspireSchema<T>): z.ZodType<T> {
  return z.unknown().transform((value, ctx): T => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      ctx.addIssue({
        code: 'custom',
        message: parsed.error instanceof Error
          ? parsed.error.message
          : 'Invalid NetScript Aspire configuration value',
      });
      return z.NEVER;
    }
    return parsed.data;
  });
}

${narrowedSectionBlock}/** Inferred project config type with literal resource name keys. */
export type ProjectConfig = ${projectConfigType};

/**
 * Project-specific config schema with literal resource name keys.
 * Generated from appsettings.json at \`netscript generate\` time.
 *
 * Enables type-safe resource name inference:
 * \`KnownServices<ProjectConfig>\` resolves to literal union types.
 */
export const ProjectConfigSchema: z.ZodType<ProjectConfig> = ${schemaExpression};
`;
}
