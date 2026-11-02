import { assertEquals, assertRejects } from '@std/assert';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';

const moduleUrl = (source: string) => `data:application/typescript,${encodeURIComponent(source)}`;
const vars = {
  serviceName: 'orders',
  projectName: 'example',
  modelName: 'Order',
  entityName: 'order',
};

Deno.test('generated application publishes only committed create/update results and verified actors', async () => {
  const domain = moduleUrl(
    'export const listQuery = (x) => x; export const pagination = () => ({});',
  );
  const source = renderTemplateAssetSync(TEMPLATE_KEYS.serviceApplicationEntity, vars)
    .replace("'../domain/order.ts'", JSON.stringify(domain));
  const { createOrdersApplication } = await import(moduleUrl(source));
  const row = { id: 42, reference: 'REC-42', updatedAt: '2026-11-02T00:00:00Z' };
  const events: unknown[] = [];
  const actor = { name: 'Verified actor', kind: 'authenticated' };
  let missing = false;
  let failed = false;
  const application = createOrdersApplication({
    create: () => failed ? Promise.reject(new Error('database failed')) : Promise.resolve(row),
    update: () => Promise.resolve(missing ? null : row),
  }, {
    record: (...args: unknown[]) => {
      events.push(args);
      return Promise.resolve();
    },
  });
  assertEquals(await application.create({}, actor), row);
  assertEquals(await application.update(42, {}, actor), row);
  assertEquals(events, [['created', row, actor], ['updated', row, actor]]);
  missing = true;
  assertEquals(await application.update(999, {}, actor), null);
  failed = true;
  await assertRejects(() => application.create({}, actor), Error, 'database failed');
  assertEquals(events.length, 2);
  const unlinked = createOrdersApplication({ create: () => Promise.resolve(row) });
  assertEquals(await unlinked.create({}), row);
});

Deno.test('generated memory update publishes the changed snapshot only when the record exists', async () => {
  const domain = moduleUrl(
    'export const listQuery = (x) => x; export const listResult = (x) => x; export const statusSummary = (x) => x;',
  );
  const source = renderTemplateAssetSync(TEMPLATE_KEYS.serviceApplicationEntityMemory, vars)
    .replace("'../domain/order.ts'", JSON.stringify(domain));
  const { createOrdersApplication } = await import(moduleUrl(source));
  const events: unknown[] = [];
  const row = { id: 42, reference: 'REC-42', updatedAt: '2026-11-02T00:00:00Z' };
  const application = createOrdersApplication({
    updateStatus: (id: number) => Promise.resolve(id === 42 ? row : null),
  }, {
    record: (...args: unknown[]) => {
      events.push(args);
      return Promise.resolve();
    },
  });
  await application.updateStatus({ id: 42, status: 'paid' });
  await application.updateStatus({ id: 99, status: 'paid' });
  assertEquals(events, [['updated', row, undefined]]);
});

Deno.test('rejecting activity publishers cannot turn committed mutations into retryable failures', async () => {
  const errors: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    errors.push(args);
  };
  try {
    for (const memory of [false, true]) {
      const domain = moduleUrl(
        'export const listQuery = x => x; export const pagination = () => ({}); export const listResult = x => x; export const statusSummary = x => x;',
      );
      const source = renderTemplateAssetSync(
        memory
          ? TEMPLATE_KEYS.serviceApplicationEntityMemory
          : TEMPLATE_KEYS.serviceApplicationEntity,
        vars,
      )
        .replace("'../domain/order.ts'", JSON.stringify(domain));
      const { createOrdersApplication } = await import(moduleUrl(source));
      const row = { id: 42, reference: 'REC-42', updatedAt: new Date() };
      const repository = {
        create: () => Promise.resolve(row),
        update: () => Promise.resolve(row),
        updateStatus: () => Promise.resolve(row),
      };
      const application = createOrdersApplication(repository, {
        record: () => Promise.reject(new Error('stream unavailable')),
      });
      if (memory) assertEquals(await application.updateStatus({ id: 42, status: 'paid' }), row);
      else {
        assertEquals(await application.create({}), row);
        assertEquals(await application.update(42, {}), row);
      }
    }
    assertEquals(errors.length, 3);
    assertEquals(errors.every((args) => String(args[0]).includes('committed mutation')), true);
  } finally {
    console.warn = originalWarn;
  }
});
