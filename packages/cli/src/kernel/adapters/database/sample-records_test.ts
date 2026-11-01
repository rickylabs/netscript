import { assert, assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { DatabaseScaffolder } from './scaffolder.ts';
import { generateDatabaseSeed } from '../../templates/database/generate-database-seed.ts';

const moduleUrl = (source: string) => `data:application/typescript,${encodeURIComponent(source)}`;
const sampleSource = renderTemplateAssetSync(TEMPLATE_KEYS.serviceSampleRecords, {
  modelName: 'Shipment',
});
const { createSampleRecords } = await import(moduleUrl(sampleSource));
const orpcServerSpecifier = 'npm:@orpc/server@' +
  JSON.parse(await Deno.readTextFile(new URL('../../../../../../deno.json', import.meta.url)))
    .catalog['@orpc/server'];
const anchor = new Date('2026-11-01T15:00:00Z');

Deno.test('shared sample has forty deterministic rich rows across sixty UTC days', () => {
  const rows = createSampleRecords(anchor);
  assertEquals(rows, createSampleRecords(new Date('2026-11-01T01:00:00Z')));
  assertEquals(rows.length, 40);
  assertEquals(new Set(rows.map((row: { reference: string }) => row.reference)).size, 40);
  assertEquals(new Set(rows.map((row: { status: string }) => row.status)).size, 6);
  assertEquals(new Set(rows.map((row: { ownerEmail: string }) => row.ownerEmail)).size, 5);
  assertEquals(rows[0].reference, 'REC-10482');
  assertEquals(rows[0].name, 'Seed Shipment');
  assertEquals(rows[0].createdAt, '2026-11-01T00:00:00.000Z');
  assertEquals(rows[39].createdAt, '2026-09-03T00:00:00.000Z');
  assert(
    rows.every((row: { amount: number; status: string; currency: string }) =>
      Number.isSafeInteger(row.amount) && row.currency === 'USD' &&
      (row.status !== 'refunded' || row.amount < 0)
    ),
  );
});

Deno.test('emitted seed upserts every reference, preserves edits on rerun and disconnects on error', async () => {
  const databaseUrl = moduleUrl(`
    export const rows = new Map<string, {reference: string; name: string}>();
    export let disconnects = 0;
    export let fail = false;
    export function setFail() { fail = true; }
    export const db = {
      getClient: async () => ({ shipment: { upsert: async ({where, create, update}: {where: {reference: string}; create: {reference: string; name: string}; update: object}) => {
        if (fail) throw new Error('database failure');
        if (Object.keys(update).length) throw new Error('seed must preserve edits');
        if (!rows.has(where.reference)) rows.set(where.reference, create);
      } } }),
      disconnect: async () => { disconnects++; },
    };`);
  const database = await import(databaseUrl);
  const source = generateDatabaseSeed({ modelName: 'Shipment' }).replace(
    "'../mod.ts'",
    JSON.stringify(databaseUrl),
  ).replace('if (import.meta.main) {', 'export async function runSeed() {');
  const { runSeed } = await import(moduleUrl(source));
  await runSeed();
  assertEquals(database.rows.size, 40);
  // Fresh auto-increment IDs preserve chronology, so the default descending CRUD page is recent.
  const inserted = [...database.rows.values()];
  assertEquals(inserted[0].reference, 'REC-10443');
  assertEquals(inserted.at(-1).reference, 'REC-10482');
  database.rows.get('REC-10482').name = 'Owner edited this';
  await runSeed();
  assertEquals(database.rows.size, 40);
  assertEquals(database.rows.get('REC-10482').name, 'Owner edited this');
  assertEquals(database.disconnects, 2);
  database.setFail();
  await assertRejects(runSeed, Error, 'database failure');
  assertEquals(database.disconnects, 3);
});

for (const engine of ['postgres', 'mysql', 'sqlite', 'mssql'] as const) {
  Deno.test(`${engine} generates the rich portable model, placeholder contract and idempotent model-named seed`, async () => {
    const fs = new MemoryFileSystemAdapter();
    const adapter = new StringTemplateAdapter(fs);
    const scaffolder = new DatabaseScaffolder(new Scaffolder(adapter, fs), fs, adapter);
    await scaffolder.scaffold({
      projectName: 'sample',
      targetPath: '/project',
      engine,
      modelName: 'Shipment',
      importMode: 'jsr',
    });
    const schema = await fs.readFile(`/project/database/${engine}/schema/schema.prisma`);
    for (
      const field of [
        'reference',
        'ownerName',
        'ownerEmail',
        'status',
        'amount',
        'currency',
        'createdAt',
        'updatedAt',
      ]
    ) assert(new RegExp(`\\b${field}\\s+(?:String|Int|DateTime)\\b`).test(schema), field);
    assert(schema.includes('reference String   @unique @default(cuid())'));
    const zod = await fs.readFile(`/project/database/${engine}/schema/.generated/zod/crud.ts`);
    const zodUrl = moduleUrl(zod.replace("'zod'", JSON.stringify(import.meta.resolve('zod'))));
    const { ShipmentSchema, ShipmentCreateInput } = await import(zodUrl);
    const sample = { ...createSampleRecords(anchor)[0], id: 1 };
    assertEquals(ShipmentSchema.parse(sample).reference, 'REC-10482');
    assertEquals(ShipmentCreateInput.parse({ name: 'New record' }), { name: 'New record' });
    const seed = await fs.readFile(`/project/database/${engine}/scripts/seed.ts`);
    assert(seed.includes('client.shipment.upsert('));
    // Execute the real generated service contract with this engine's placeholder schema.
    const contractSource = renderTemplateAssetSync(TEMPLATE_KEYS.serviceContract, {
      serviceName: 'shipments',
      modelName: 'Shipment',
    })
      .replace("'@database/zod'", JSON.stringify(zodUrl))
      .replace("'zod'", JSON.stringify(import.meta.resolve('zod')))
      .replace("'@orpc/server'", JSON.stringify(orpcServerSpecifier))
      .replace(
        "'@netscript/contracts'",
        JSON.stringify(new URL('../../../../../contracts/mod.ts', import.meta.url).href),
      )
      .replace(
        "'@netscript/contracts/crud'",
        JSON.stringify(new URL('../../../../../contracts/crud.ts', import.meta.url).href),
      );
    const contract = await import(moduleUrl(contractSource));
    assertEquals(contract.ShipmentsShipmentSchemaV1.parse(sample).amount, 8990);
    assertEquals(
      'reference' in
        contract.ShipmentsShipmentCreateInputSchemaV1.parse({
          name: 'New record',
          reference: 'REC-10482',
        }),
      false,
    );
    assertEquals(
      'reference' in
        contract.ShipmentsShipmentUpdateInputSchemaV1.parse({ reference: 'REC-10482' }),
      false,
    );
    assertEquals(
      contract.ShipmentsShipmentSchemaV1.safeParse({ ...sample, status: 'invented' }).success,
      false,
    );
    assertEquals(
      contract.ShipmentsShipmentCreateInputSchemaV1.safeParse({ name: 'New record', amount: 0.5 })
        .success,
      false,
    );
    const listSchema = contract.ShipmentsCrudContractV1.list['~orpc'].inputSchema;
    assertEquals(
      listSchema.parse({ status: 'paid', page: 2, limit: 10, sortBy: 'amount', sortOrder: 'asc' })
        .status,
      'paid',
    );
    assertEquals(listSchema.safeParse({ status: 'invented' }).success, false);
    const entity = renderTemplateAssetSync(TEMPLATE_KEYS.serviceDomainEntity, {
      serviceName: 'shipments',
      modelName: 'Shipment',
      projectName: 'sample',
    });
    const domain = await import(moduleUrl(entity));
    for (const sortBy of [undefined, 'id', 'unsafe']) {
      assertEquals(domain.listQuery({ page: 1, limit: 10, sortBy, sortOrder: 'desc' }).orderBy, [{
        id: 'desc',
      }]);
    }
    assertEquals(
      domain.listQuery({ page: 2, limit: 10, status: 'paid', sortBy: 'amount', sortOrder: 'asc' }),
      {
        skip: 10,
        take: 10,
        where: { status: 'paid' },
        orderBy: [{ amount: 'asc' }, { id: 'asc' }],
      },
    );
  });
}

Deno.test('memory sample supports status filtering and stable sorting before pagination', async () => {
  const source = renderTemplateAssetSync(TEMPLATE_KEYS.serviceMemoryRepository, {
    serviceName: 'members',
    projectName: 'sample',
    entityName: 'members',
  }).replace("'./sample-records.ts'", JSON.stringify(moduleUrl(sampleSource)));
  const { createMemoryMembersRepository } = await import(moduleUrl(source));
  const repository = createMemoryMembersRepository();
  const query = { offset: 0, limit: 2, status: 'paid', sortBy: 'amount', sortOrder: 'asc' };
  const first = await repository.list(query);
  const second = await repository.list({ ...query, offset: 2 });
  assertEquals(first.total, 7);
  assert(first.items.every((row: { status: string }) => row.status === 'paid'));
  assert(first.items[0].amount <= first.items[1].amount);
  assert(first.items[1].amount <= second.items[0].amount);
  const copy = await repository.updateStatus(first.items[0].id, 'refunded', 'Refunded');
  assertEquals(copy.status, 'refunded');
  assertEquals(first.items[0].status, 'paid');
  assertEquals((await createMemoryMembersRepository().list(query)).total, 7);
});
