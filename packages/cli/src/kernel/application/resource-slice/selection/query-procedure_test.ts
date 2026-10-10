import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { join } from '@std/path';
import { createQueryFactories } from '@netscript/sdk/query';
import { DenoProcess } from '../../../adapters/runtime/process/deno-process.ts';
import { DenoFileSystem } from '../../../adapters/runtime/file-system/deno-file-system.ts';
import { selectResourceClient } from './client-selector.ts';
import {
  describeUnresolvedQueryProcedure,
  inspectQueryProcedure,
  parseQueryProcedurePath,
  resolveQueryProcedure,
} from './query-procedure.ts';
import type { SelectedResourceClient } from '../resource-slice-contract.ts';

const NAMESPACES = ['alpha', 'beta', 'gamma', 'serviceNamespace'] as const;

const CLIENT: SelectedResourceClient = {
  serviceName: 'catalog',
  moduleSpecifier: '@app/lib/catalog.ts',
  queryFactoryName: 'catalogQueries',
};

/** A real SDK query factory export fronting four contract namespaces. */
function fourNamespaceQueries(): unknown {
  const procedure = { '~orpc': {} };
  const contracts = {
    alpha: { listItems: procedure, listChildren: procedure },
    beta: { listOrders: procedure },
    gamma: { getStats: procedure },
    serviceNamespace: { health: procedure },
  };
  const config = Object.fromEntries(
    Object.entries(contracts).map(([name, contract]) => [name, { contract, client: {} }]),
  );
  return createQueryFactories(config as never);
}

/**
 * A hand-authored multi-namespace client module, self-contained so the probe
 * child process needs no dependency resolution. It mirrors the SDK shape:
 * namespace -> { resource, invalidate, <procedure>: fn & { queryOptions, clientKey } }.
 */
const FOUR_NAMESPACE_MODULE = `const createQueryFactories = (factories) => Object.fromEntries(
  Object.entries(factories).map(([resource, { contract }]) => [resource, {
    resource,
    invalidate: () => Promise.resolve(),
    ...Object.fromEntries(Object.keys(contract).map((action) => {
      const method = () => Promise.resolve(null);
      method.queryOptions = (input) => ({ queryKey: [resource, action, { input }] });
      method.clientKey = () => [resource, action];
      return [action, method];
    })),
  }]),
);
export const catalogName = 'catalog';
export const catalogQueries = createQueryFactories({
  alpha: { contract: { listItems: {}, listChildren: {} } },
  serviceNamespace: { contract: { health: {} } },
  beta: { contract: { listOrders: {} } },
  gamma: { contract: { getStats: {} } },
});
`;

async function withFourNamespaceApp(run: (appRoot: string) => Promise<void>): Promise<void> {
  const workspace = await Deno.makeTempDir({ prefix: 'netscript-query-procedure-' });
  try {
    const appRoot = join(workspace, 'apps', 'dashboard');
    await Deno.mkdir(join(appRoot, 'lib'), { recursive: true });
    await Deno.writeTextFile(join(appRoot, 'deno.json'), '{}\n');
    await Deno.writeTextFile(join(appRoot, 'lib', 'catalog.ts'), FOUR_NAMESPACE_MODULE);
    // A one-procedure contract with no list: the gate `generate resource` used to inherit.
    const contracts = join(workspace, 'contracts', 'versions', 'v1');
    await Deno.mkdir(contracts, { recursive: true });
    await Deno.writeTextFile(
      join(contracts, 'catalog.contract.ts'),
      'export const CatalogContractV1 = { health: {} };\n',
    );
    await run(appRoot);
  } finally {
    await Deno.remove(workspace, { recursive: true });
  }
}

const runtime = { process: new DenoProcess(), executable: Deno.execPath() };

Deno.test('procedure path parsing accepts dotted identifiers and rejects malformed paths', () => {
  assertEquals(parseQueryProcedurePath('alpha.listItems'), ['alpha', 'listItems']);
  for (const invalid of ['', 'alpha..listItems', '.alpha', 'alpha.', 'alpha.list-items']) {
    assertThrows(() => parseQueryProcedurePath(invalid), Error, 'Invalid query procedure');
  }
});

Deno.test('inspection resolves a namespaced procedure on a real four-namespace SDK factory', () => {
  const queries = fourNamespaceQueries();

  assertEquals(inspectQueryProcedure(queries, ['alpha', 'listItems']), { kind: 'query' });
  assertEquals(inspectQueryProcedure(queries, ['serviceNamespace', 'health']), { kind: 'query' });
});

Deno.test('inspection reports where an unresolved path stopped and what exists there', () => {
  const queries = fourNamespaceQueries();

  assertEquals(inspectQueryProcedure(queries, ['v1', 'alpha', 'listItems']), {
    kind: 'unresolved',
    resolved: [],
    available: [...NAMESPACES],
    topLevel: [...NAMESPACES],
  });
  assertEquals(inspectQueryProcedure(queries, ['alpha', 'listItemz']), {
    kind: 'unresolved',
    resolved: ['alpha'],
    available: ['listChildren', 'listItems'],
    topLevel: [...NAMESPACES],
  });
  assertEquals(inspectQueryProcedure(queries, ['alpha']), {
    kind: 'unresolved',
    resolved: ['alpha'],
    available: ['listChildren', 'listItems'],
    topLevel: [...NAMESPACES],
  });
  // Inherited keys never resolve.
  assertEquals(inspectQueryProcedure(queries, ['toString']).kind, 'unresolved');
});

Deno.test('unresolved message names the requested procedure, the searched client, and its keys', () => {
  const message = describeUnresolvedQueryProcedure('v1.alpha.listItems', CLIENT, {
    kind: 'unresolved',
    resolved: [],
    available: [...NAMESPACES],
    topLevel: [...NAMESPACES],
  });

  assertEquals(
    message,
    "Query procedure 'v1.alpha.listItems' does not exist on client 'catalog' (catalogQueries in @app/lib/catalog.ts): catalogQueries has no top-level 'v1'. Available top-level keys: alpha, beta, gamma, serviceNamespace. A client fronting several namespaces is addressed as --procedure <namespace>.<procedure>.",
  );
  assertStringIncludes(
    describeUnresolvedQueryProcedure('alpha.listItemz', CLIENT, {
      kind: 'unresolved',
      resolved: ['alpha'],
      available: ['listChildren', 'listItems'],
      topLevel: [...NAMESPACES],
    }),
    "'alpha' has no 'listItemz'. Keys under 'alpha': listChildren, listItems.",
  );
  assertStringIncludes(
    describeUnresolvedQueryProcedure('alpha', CLIENT, {
      kind: 'unresolved',
      resolved: ['alpha'],
      available: ['listChildren', 'listItems'],
      topLevel: [...NAMESPACES],
    }),
    "'alpha' resolves to a namespace, not a query procedure.",
  );
});

Deno.test('generate resource selects a four-namespace client whose contract has no list and resolves alpha.listItems', async () => {
  await withFourNamespaceApp(async (appRoot) => {
    const client = await selectResourceClient(appRoot, new DenoFileSystem(), 'catalog');
    assertEquals(client, CLIENT);

    assertEquals(
      await resolveQueryProcedure({ appRoot, client, procedure: 'alpha.listItems' }, runtime),
      { path: ['alpha', 'listItems'], kind: 'query' },
    );
  });
});

Deno.test('an unresolved procedure on a four-namespace client reports the mismatch, not a contract', async () => {
  await withFourNamespaceApp(async (appRoot) => {
    const client = await selectResourceClient(appRoot, new DenoFileSystem(), 'catalog');

    const error = await assertRejects(
      () => resolveQueryProcedure({ appRoot, client, procedure: 'v1.alpha.listItems' }, runtime),
      Error,
    );
    assertStringIncludes(error.message, "Query procedure 'v1.alpha.listItems'");
    assertStringIncludes(error.message, 'catalogQueries in @app/lib/catalog.ts');
    assertStringIncludes(
      error.message,
      'Available top-level keys: alpha, beta, gamma, serviceNamespace.',
    );
    assertEquals(error.message.includes('contract.ts'), false);
  });
});

Deno.test('a client module that fails to load is reported as a load failure, not a missing procedure', async () => {
  await withFourNamespaceApp(async (appRoot) => {
    await Deno.writeTextFile(join(appRoot, 'lib', 'catalog.ts'), 'throw new Error("boom");\n');

    await assertRejects(
      () =>
        resolveQueryProcedure({ appRoot, client: CLIENT, procedure: 'alpha.listItems' }, runtime),
      Error,
      "Could not load client module @app/lib/catalog.ts to resolve query procedure 'alpha.listItems'",
    );
  });
});
