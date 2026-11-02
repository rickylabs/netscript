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
    // Persist intent after successful writes; workers are not registered during DB CLI mode.
    const handoff = new URL('../../../.netscript/sample-seed.json', import.meta.url);
    await Deno.mkdir(new URL('./', handoff), { recursive: true });
    const pending = new URL('sample-seed.' + crypto.randomUUID() + '.tmp', handoff);
    try {
      await Deno.writeTextFile(pending, JSON.stringify({ version: 1, seedId: crypto.randomUUID() }), { createNew: true });
      try {
        // Atomic, no-clobber publication: readers see one complete winning request.
        await Deno.link(fromFileUrl(pending), fromFileUrl(handoff));
      } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) throw error;
      }
      const request = JSON.parse(await Deno.readTextFile(handoff));
      if (request?.version !== 1 || typeof request.seedId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.seedId)) {
        throw new Error('Invalid sample seed handoff; inspect .netscript/sample-seed.json.');
      }
    } finally {
      await Deno.remove(pending).catch((error) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
    console.log('✅ Seeded 40 representative ${modelName} records (existing references preserved).');
  } finally {
    await db.disconnect();
  }`;

  return renderTemplateAssetSync(TEMPLATE_KEYS.databaseSeed, {
    __slot0__: "import { fromFileUrl } from '@std/path';\nimport { db } from '../mod.ts';\n\n" +
      renderTemplateAssetSync(TEMPLATE_KEYS.serviceSampleRecords, { modelName }),
    __slot1__: body,
  });
}
