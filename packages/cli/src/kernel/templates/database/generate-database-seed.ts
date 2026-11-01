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
  const body = `  const client = await db.getClient();
  try {
    // Insert oldest first so the generic CRUD page's ID-descending default also shows recent data.
    for (const row of createSampleRecords().toReversed()) {
      await client.${delegateName}.upsert({
        where: { reference: row.reference },
        create: { ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) },
        update: {},
      });
    }
    console.log('✅ Seeded 40 representative ${modelName} records (existing references preserved).');
  } finally {
    await db.disconnect();
  }`;

  return renderTemplateAssetSync(TEMPLATE_KEYS.databaseSeed, {
    __slot0__: "import { db } from '../mod.ts';\n\n" +
      renderTemplateAssetSync(TEMPLATE_KEYS.serviceSampleRecords, { modelName }),
    __slot1__: body,
  });
}
