import { z } from 'jsr:@zod/zod@4.4.3';
import { PluginInstallerManifestSchema } from '../../../packages/plugin/src/protocol/manifest.ts';

export const PLUGIN_MANIFEST_SCHEMA_PATH = 'packages/plugin/schema/scaffold.plugin.schema.json';

const SCHEMA_ID = 'https://rickylabs.github.io/netscript/schemas/scaffold.plugin.schema.json';
const SCHEMA_TITLE = 'NetScript plugin scaffold manifest';

/** Generate the canonical `scaffold.plugin.json` JSON Schema text. */
export function generatePluginManifestSchemaText(): string {
  const schema = z.toJSONSchema(PluginInstallerManifestSchema, {
    target: 'draft-7',
  });

  return `${
    JSON.stringify(
      sortJsonValue({
        ...schema,
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: SCHEMA_ID,
        title: SCHEMA_TITLE,
      }),
      null,
      2,
    )
  }\n`;
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (!isRecord(value)) {
    return value;
  }

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortJsonValue(value[key]);
  }
  return sorted;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
