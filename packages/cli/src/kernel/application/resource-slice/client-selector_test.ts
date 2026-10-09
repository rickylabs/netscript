import { assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { selectClientBinding, selectResourceClient } from './client-selector.ts';

const APP_ROOT = '/workspace/shop/apps/dashboard';
const PREREQUISITE = 'netscript service add --name <service> --with-client';

function queryModule(service: string): string {
  return `import { createQueryFactories } from '@netscript/sdk/query';
export const ${service}Name = '${service}';
export const ${service}Queries = createQueryFactories({
  service: { contract: ${service}Contract, client: ${service}Client },
}).service;
`;
}

async function seedClient(
  fs: MemoryFileSystemAdapter,
  fileName: string,
  service: string,
): Promise<void> {
  await fs.writeFile(`${APP_ROOT}/lib/${fileName}.ts`, queryModule(service));
  await fs.writeFile(
    `/workspace/shop/contracts/versions/v1/${service}.contract.ts`,
    `export const ${service}CrudContractV1 = createCrudContract({ resource: '${service}' });\n`,
  );
}

Deno.test('client selector fails closed for exactly zero candidates with the stable prerequisite', async () => {
  const fs = new MemoryFileSystemAdapter();

  await assertRejects(
    () => selectClientBinding(APP_ROOT, fs),
    Error,
    `Cannot scaffold a data-bound island: no query client found. Exactly one conventional generated client is required. Prerequisite: ${PREREQUISITE}.`,
  );
});

Deno.test('client selector accepts exactly one conventional candidate without --client', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedClient(fs, 'not-the-service-name', 'orders');

  assertEquals(await selectClientBinding(APP_ROOT, fs), {
    path: `${APP_ROOT}/lib/not-the-service-name.ts`,
    queries: 'ordersQueries',
    input: `{ limit: 20, page: 1, sortBy: 'id', sortOrder: 'asc' } as const`,
  });
});

Deno.test('--client selects the exact declared service identity', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedClient(fs, 'orders', 'orders');
  await seedClient(fs, 'not-the-service-name', 'payments');

  assertEquals(await selectClientBinding(APP_ROOT, fs, 'payments'), {
    path: `${APP_ROOT}/lib/not-the-service-name.ts`,
    queries: 'paymentsQueries',
    input: `{ limit: 20, page: 1, sortBy: 'id', sortOrder: 'asc' } as const`,
  });
});

Deno.test('client selector fails closed for many candidates without --client and sorts the stable remedy', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedClient(fs, 'orders', 'orders');
  await seedClient(fs, 'payments', 'payments');

  await assertRejects(
    () => selectClientBinding(APP_ROOT, fs),
    Error,
    `Cannot scaffold a data-bound island: multiple query clients are ambiguous. Candidates: ${APP_ROOT}/lib/orders.ts, ${APP_ROOT}/lib/payments.ts. Available services: orders, payments. Use --client <service> to select one. Exactly one conventional generated client is required. Prerequisite: ${PREREQUISITE}.`,
  );
});

Deno.test('--client reports an exact zero-match diagnostic and available services', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedClient(fs, 'orders', 'orders');
  await seedClient(fs, 'payments', 'payments');

  await assertRejects(
    () => selectClientBinding(APP_ROOT, fs, 'users'),
    Error,
    `Cannot scaffold a data-bound island: selected client 'users' matches no query client. Candidates: ${APP_ROOT}/lib/orders.ts, ${APP_ROOT}/lib/payments.ts. Available services: orders, payments. Use --client <service> to select one. Exactly one conventional generated client is required. Prerequisite: ${PREREQUISITE}.`,
  );
});

Deno.test('--client reports an exact duplicate-match diagnostic', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedClient(fs, 'orders', 'orders');
  await seedClient(fs, 'orders-copy', 'orders');

  await assertRejects(
    () => selectClientBinding(APP_ROOT, fs, 'orders'),
    Error,
    `Cannot scaffold a data-bound island: selected client 'orders' matches more than one query client. Candidates: ${APP_ROOT}/lib/orders-copy.ts, ${APP_ROOT}/lib/orders.ts. More than one candidate declares service 'orders'. Exactly one conventional generated client is required. Prerequisite: ${PREREQUISITE}.`,
  );
});

Deno.test('generate resource client selection does not apply the ui:add list-contract gate', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(`${APP_ROOT}/lib/catalog.ts`, queryModule('catalog'));
  const contract = '/workspace/shop/contracts/versions/v1/catalog.contract.ts';
  await fs.writeFile(contract, 'export const CatalogContractV1 = { health: oc.route({}) };\n');

  const expected = {
    serviceName: 'catalog',
    moduleSpecifier: '@app/lib/catalog.ts',
    queryFactoryName: 'catalogQueries',
  };
  assertEquals(await selectResourceClient(APP_ROOT, fs, 'catalog'), expected);
  assertEquals(await selectResourceClient(APP_ROOT, fs), expected);
  // ui:add still needs a list contract for its data-bound island input.
  await assertRejects(
    () => selectClientBinding(APP_ROOT, fs, 'catalog'),
    Error,
    `unsupported list contract ${contract}`,
  );
  await fs.remove(contract);
  assertEquals(await selectResourceClient(APP_ROOT, fs, 'catalog'), expected);
});

Deno.test('a hand-authored client fronting several namespaces is selectable with --client', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedClient(fs, 'orders', 'orders');
  await fs.writeFile(
    `${APP_ROOT}/lib/catalog.ts`,
    `import { createQueryFactories } from '@netscript/sdk/query';
export const catalogName = 'catalog';
export const catalogQueries = createQueryFactories({
  alpha: { contract: AlphaContractV1, client: alphaClient },
  serviceNamespace: { contract: CatalogContractV1, client: catalogClient },
  beta: { contract: BetaContractV1, client: betaClient },
  gamma: { contract: GammaContractV1, client: gammaClient },
});
`,
  );

  assertEquals(await selectResourceClient(APP_ROOT, fs, 'catalog'), {
    serviceName: 'catalog',
    moduleSpecifier: '@app/lib/catalog.ts',
    queryFactoryName: 'catalogQueries',
  });
});
