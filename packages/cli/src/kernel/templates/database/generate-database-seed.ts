/**
 * @module templates/database/generate-database-seed
 */

import { toCamelCase } from '@std/text';

import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/** Options for generating a database seed script. */
export interface DatabaseSeedOptions {
  /** Concrete generated Prisma model, when the schema has one. */
  readonly modelName?: string;
}

/** Generate an idempotent representative seed or a truthful no-model message. */
export function generateDatabaseSeed(options: DatabaseSeedOptions): string {
  const modelName = options.modelName?.trim();
  if (!modelName) {
    return renderTemplateAssetSync(TEMPLATE_KEYS.databaseSeed, {
      __slot0__: '',
      __slot1__: "  console.log('ℹ️ No database model is available; no seed rows were written.');",
    });
  }

  const delegateName = toCamelCase(modelName);
  const seedName = escapeSingleQuoted(`Seed ${modelName}`);
  const body = `  const client = await db.getClient();

  try {
    const existing = await client.${delegateName}.findFirst({
      select: { id: true },
    });
    if (!existing) {
      await client.${delegateName}.create({
        data: {
          name: '${seedName}',
        },
      });
      console.log('✅ Seeded representative ${modelName} row.');
    } else {
      console.log('ℹ️ ${modelName} rows already exist; seed left them unchanged.');
    }
  } finally {
    await db.disconnect();
  }`;

  return renderTemplateAssetSync(TEMPLATE_KEYS.databaseSeed, {
    __slot0__: "import { db } from '../mod.ts';",
    __slot1__: body,
  });
}

function escapeSingleQuoted(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}
