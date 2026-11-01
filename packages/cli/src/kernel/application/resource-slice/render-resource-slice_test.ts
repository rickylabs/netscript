import { checkGeneratedFiles } from '../../../../../../.llm/tools/testing/check-generated-files.ts';
import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';
import { loadResourceSliceTemplateAssets } from '../../adapters/templates/scaffold-template-assets.ts';
import {
  normalizeResourceSliceInput,
  parseOwnedResourceSliceLeaf,
  type ResourceSliceCandidateLeaf,
  type ResourceSliceOptionalVariant,
  sha256ResourceSliceBody,
} from './resource-slice-contract.ts';
import { planResourceSlice } from './plan-resource-slice.ts';
import { renderResourceSlice } from './render-resource-slice.ts';
import {
  QUERY_RESULT_SUCCESS_RETURN,
  QUERY_RESULT_TEMPLATE,
} from '../ui/page/query-result-template.ts';

const GOLDEN_HASHES: Readonly<
  Record<string, readonly (readonly [path: string, hash: string])[]>
> = {
  'core': [
    [
      'routes/orders/(_components)/orders-view.tsx',
      'ed963139530f0ce26351dccbed98e2f25f3306002e2da8d24b4189f5075e1ac2',
    ],
    [
      'routes/orders/(_islands)/OrdersIsland.tsx',
      '69cbd4c62327e79d98b8c64d8232d44dddb662c7cfcc4d67119adc545c4fadc2',
    ],
    [
      'routes/orders/(_shared)/orders-loaders.ts',
      '934266a5a8af4950a5b0ffd59a265fd88bf03fce8b99a143662b4155ac4d338c',
    ],
    [
      'routes/orders/index.layout.tsx',
      '53ae2769f588c0751ab8f456d863d11f781e6accfe40c3098f375c902d2b19c3',
    ],
    [
      'routes/orders/index.route.ts',
      'ff526aecef3989a21b3208411e403d9313396a8878048bd1ca5076366d3841da',
    ],
    [
      'routes/orders/index.tsx',
      '5fc31d035c8c9d3f7ec7b0726ec58d733bb13948fd3f227859bd874380b7290b',
    ],
  ],
  'form': [
    [
      'routes/orders/(_components)/orders-form.tsx',
      '50eb51a18d893fcd00e8069014d5c9210118dde5bb9e4dcb6a0e3df9fac05ea6',
    ],
    [
      'routes/orders/(_components)/orders-view.tsx',
      '0fa4c162df9a92798b167b8ad1510208c047f6d960c2112cf5f3f89023f343ae',
    ],
    [
      'routes/orders/(_islands)/OrdersIsland.tsx',
      '69cbd4c62327e79d98b8c64d8232d44dddb662c7cfcc4d67119adc545c4fadc2',
    ],
    [
      'routes/orders/(_lib)/orders-form.ts',
      '798c94cab4c412bc092c1fe8c8d8c02a6bb2f4d756d3705a5cf7829117336795',
    ],
    [
      'routes/orders/(_shared)/orders-loaders.ts',
      '934266a5a8af4950a5b0ffd59a265fd88bf03fce8b99a143662b4155ac4d338c',
    ],
    [
      'routes/orders/index.layout.tsx',
      '53ae2769f588c0751ab8f456d863d11f781e6accfe40c3098f375c902d2b19c3',
    ],
    [
      'routes/orders/index.route.ts',
      'ff526aecef3989a21b3208411e403d9313396a8878048bd1ca5076366d3841da',
    ],
    [
      'routes/orders/index.tsx',
      'bf05a5cc911614a194ac61bba4b68b4cbb21a558cc0b08e3bab6d5263dcfb66f',
    ],
  ],
  'partial': [
    [
      'routes/orders/(_components)/orders-summary.tsx',
      '8629b1169e808ea6c7185372eb93a9a74b99d299b4872fd730742b7d9692e163',
    ],
    [
      'routes/orders/(_components)/orders-view.tsx',
      '456f18b057f76b52fc26488c7f7b8dda318b351594e48d6dc2d7de3c74bb2d60',
    ],
    [
      'routes/orders/(_islands)/OrdersIsland.tsx',
      '69cbd4c62327e79d98b8c64d8232d44dddb662c7cfcc4d67119adc545c4fadc2',
    ],
    [
      'routes/orders/(_shared)/orders-loaders.ts',
      '934266a5a8af4950a5b0ffd59a265fd88bf03fce8b99a143662b4155ac4d338c',
    ],
    [
      'routes/orders/index.layout.tsx',
      '53ae2769f588c0751ab8f456d863d11f781e6accfe40c3098f375c902d2b19c3',
    ],
    [
      'routes/orders/index.route.ts',
      'ff526aecef3989a21b3208411e403d9313396a8878048bd1ca5076366d3841da',
    ],
    [
      'routes/orders/index.tsx',
      '0358d4ba43047287c7fd06ec16e0b50dc52706ebb61a2daaf659b4871fa9d52d',
    ],
    [
      'routes/partials/orders/summary.tsx',
      '445ff503385fb04f245191f53bfd05b98f4d53ac0e632b7b82e05b0f0480a9fb',
    ],
  ],
  'stream': [
    [
      'routes/orders/(_components)/orders-view.tsx',
      '6281279d858ef8b99493886ee1f343d4444794441e8bc307fbaf0fdd5c232441',
    ],
    [
      'routes/orders/(_islands)/OrdersIsland.tsx',
      '69cbd4c62327e79d98b8c64d8232d44dddb662c7cfcc4d67119adc545c4fadc2',
    ],
    [
      'routes/orders/(_islands)/OrdersStream.tsx',
      '0927590b89cc9f74a1617db7cb35a506a26a571c917203eb31c892636fff9aa5',
    ],
    [
      'routes/orders/(_shared)/orders-loaders.ts',
      '934266a5a8af4950a5b0ffd59a265fd88bf03fce8b99a143662b4155ac4d338c',
    ],
    [
      'routes/orders/index.layout.tsx',
      '53ae2769f588c0751ab8f456d863d11f781e6accfe40c3098f375c902d2b19c3',
    ],
    [
      'routes/orders/index.route.ts',
      'ff526aecef3989a21b3208411e403d9313396a8878048bd1ca5076366d3841da',
    ],
    [
      'routes/orders/index.tsx',
      'b0ce94e009622f19ad556741c4d67d33ba325281ed949eaef1939d4b9349df03',
    ],
  ],
};

async function render(
  variants: readonly ResourceSliceOptionalVariant[] = [],
): Promise<readonly ResourceSliceCandidateLeaf[]> {
  const input = normalizeResourceSliceInput({
    resource: 'orders',
    app: 'dashboard',
    route: '/orders',
    variants,
    client: {
      serviceName: 'orders',
      moduleSpecifier: '@app/lib/orders.ts',
      queryFactoryName: 'ordersQueries',
    },
    procedure: { path: ['list'], kind: 'query' },
  });
  return await renderResourceSlice(
    planResourceSlice(input),
    await loadResourceSliceTemplateAssets(),
    new StringTemplateAdapter(new MemoryFileSystemAdapter()),
  );
}

Deno.test('core render is neutral, cache-first, and canonically marked', async () => {
  const candidates = await render();
  assertEquals(candidates.length, 6);
  assertEquals(candidates.map((candidate) => candidate.role).sort(), [
    'island',
    'layout',
    'loaders',
    'page',
    'route-contract',
    'view',
  ]);

  for (const candidate of candidates) {
    const marker = parseOwnedResourceSliceLeaf(candidate.content);
    assert(marker, `Expected canonical ownership marker for ${candidate.path}.`);
    assertEquals(marker.resource, 'orders');
    assertEquals(marker.role, candidate.role);
    assertEquals(marker.options, ['core']);
  }

  const source = candidates.map((candidate) => candidate.content).join('\n');
  for (
    const expected of [
      'defineRouteContract({})',
      '.withRoute(appRoutes.orders)',
      ".withResource('orders', () => loadOrdersResource())",
      'createNetScriptQueryClient()',
      'ordersQueries.list.queryOptions(ordersInput)',
      'ordersQueries.list.clientKey(ordersInput)',
      'fetchQuery',
      'dehydrateQueryClient(queryClient)',
      'cachedAt',
      'QueryIsland',
      'useIslandQuery',
      'initialData: props.initialData',
      'initialDataUpdatedAt: props.cachedAt',
      'data-query-result',
    ]
  ) assertStringIncludes(source, expected);
  for (
    const forbidden of [
      /\bviewer\b/i,
      /withPolicy/,
      /withTelemetry/,
      /\bhero\b/i,
      /\bnotes\b/i,
      /\bfetch\s*\(/,
      /queryKey\s*:\s*\[/,
      /\bany\b/,
      /JSON\.parse\s*\(/,
    ]
  ) assertFalse(forbidden.test(source), `Unexpected generated pattern: ${forbidden}`);
});

Deno.test('resource islands share the page QueryResult body and success surface without duplication', async () => {
  for (
    const variants of [[], ['form'], ['partial'], ['stream'], [
      'form',
      'partial',
      'stream',
    ]] as const
  ) {
    const candidates = await render(variants);
    const island = candidates.find((candidate) => candidate.role === 'island');
    assert(island);
    assertStringIncludes(island.content, QUERY_RESULT_TEMPLATE.trim());
    assertStringIncludes(island.content, QUERY_RESULT_SUCCESS_RETURN);
    assertEquals([...island.content.matchAll(/\bfunction QueryResult\(/g)].length, 1);
    assertFalse(island.content.includes('{{queryResult'));
  }
});

Deno.test('core and each independent option match exact content goldens', async () => {
  for (
    const [name, variants] of [
      ['core', []],
      ['form', ['form']],
      ['partial', ['partial']],
      ['stream', ['stream']],
    ] as const
  ) {
    const actual = await Promise.all(
      (await render(variants)).map(async (candidate) =>
        [
          candidate.path,
          await sha256ResourceSliceBody(candidate.content),
        ] as const
      ),
    );
    assertEquals(actual, GOLDEN_HASHES[name]);
  }
});

Deno.test('each option changes only page/view and adds its declared leaves', async () => {
  const core = await render();
  const coreByPath = new Map(core.map((candidate) => [candidate.path, candidate]));
  const cases = [
    ['form', ['form-component', 'form-contract']],
    ['partial', ['partial-route', 'summary-component']],
    ['stream', ['stream-island']],
  ] as const;

  for (const [variant, expectedRoles] of cases) {
    const selected = await render([variant]);
    assertEquals(
      selected.filter((candidate) => !coreByPath.has(candidate.path)).map((candidate) =>
        candidate.role
      ).sort(),
      [...expectedRoles].sort(),
    );
    assertEquals(
      selected.filter((candidate) => {
        const prior = coreByPath.get(candidate.path);
        return prior && prior.content !== candidate.content;
      }).map((candidate) => candidate.role).sort(),
      ['page', 'view'],
    );
    for (
      const candidate of selected.filter((leaf) => leaf.role === 'page' || leaf.role === 'view')
    ) {
      const prior = coreByPath.get(candidate.path);
      assert(prior);
      assertEquals(candidate.previousCanonicalContents, [prior.content]);
    }
  }
});

Deno.test('combined render records every strict canonical page/view predecessor', async () => {
  const candidates = await render(['form', 'partial', 'stream']);
  assertEquals(candidates.length, 11);
  for (const candidate of candidates) {
    if (candidate.role !== 'page' && candidate.role !== 'view') continue;
    assertEquals(candidate.previousCanonicalContents?.length, 7);
    assertEquals(
      candidate.previousCanonicalContents?.map((content) =>
        parseOwnedResourceSliceLeaf(content)?.options.join('+')
      ),
      [
        'core',
        'core+form',
        'core+partial',
        'core+form+partial',
        'core+stream',
        'core+form+stream',
        'core+partial+stream',
      ],
    );
  }
});

Deno.test('full render type-checks as a consumer without starting a server', async () => {
  const fixtureParent = join(Deno.cwd(), 'packages', 'cli');
  const fixtureRoot = await Deno.makeTempDir({ dir: fixtureParent, prefix: '.resource-slice-' });
  try {
    const candidates = await render(['form', 'partial', 'stream']);
    for (const candidate of candidates) {
      const target = join(fixtureRoot, candidate.path);
      await Deno.mkdir(join(target, '..'), { recursive: true });
      await Deno.writeTextFile(target, candidate.content);
    }
    await writeConsumerFixture(fixtureRoot);

    const checkedFiles = candidates.map((candidate) => join(fixtureRoot, candidate.path));
    const result = await checkGeneratedFiles({
      cwd: fixtureRoot,
      args: [
        'check',
        '--no-lock',
        '--unstable-kv',
        '--config',
        join(fixtureRoot, 'deno.json'),
        ...checkedFiles,
      ],
    });
    const output = new TextDecoder().decode(result.stdout) +
      new TextDecoder().decode(result.stderr);
    assertEquals(result.code, 0, output);
  } finally {
    await Deno.remove(fixtureRoot, { recursive: true });
  }
});

async function writeConsumerFixture(root: string): Promise<void> {
  const repo = Deno.cwd();
  const fresh = `${repo}/packages/fresh`;
  const sdk = `${repo}/packages/sdk`;
  const workspaceConfig = JSON.parse(await Deno.readTextFile(join(repo, 'deno.json'))) as {
    readonly catalog: Readonly<Record<string, string>>;
  };
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    JSON.stringify(
      {
        catalog: workspaceConfig.catalog,
        imports: {
          '@app/': './',
          '@netscript/fresh/builders': `${fresh}/src/application/builders/mod.ts`,
          '@netscript/fresh/form': `${fresh}/src/application/form/mod.ts`,
          '@netscript/fresh/query': `${fresh}/src/application/query/mod.ts`,
          '@netscript/fresh/route': `${fresh}/src/application/route/mod.ts`,
          '@netscript/fresh/streams': `${fresh}/src/runtime/streams/mod.ts`,
          '@netscript/sdk/client': `${sdk}/src/client/mod.ts`,
          '@netscript/sdk/query': `${sdk}/src/query/mod.ts`,
          '@netscript/sdk/query-client': `${sdk}/src/query-client/mod.ts`,
          '@durable-streams/client': `npm:@durable-streams/client@${
            workspaceConfig.catalog['@durable-streams/client']
          }`,
          '@durable-streams/state': `npm:@durable-streams/state@${
            workspaceConfig.catalog['@durable-streams/state']
          }`,
          '@opentelemetry/api': `npm:@opentelemetry/api@${
            workspaceConfig.catalog['@opentelemetry/api']
          }`,
          '@preact/signals': 'npm:@preact/signals@2.9.2',
          'preact': 'npm:preact@^10.29.2',
          'preact/': 'npm:/preact@^10.29.2/',
          'zod': 'npm:zod@^4.6.5',
        },
        compilerOptions: {
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          isolatedDeclarations: false,
          jsx: 'precompile',
          jsxImportSource: 'preact',
          lib: ['dom', 'deno.ns', 'deno.unstable'],
        },
      },
      null,
      2,
    ) + '\n',
  );
  await Deno.writeTextFile(
    join(root, 'router.ts'),
    `import { createRouteReference } from '@netscript/fresh/route';
export const appRoutes = { orders: createRouteReference('/orders') } as const;
`,
  );
  await Deno.writeTextFile(
    join(root, 'utils.ts'),
    `export { definePage } from '@netscript/fresh/builders';
`,
  );
  await Deno.mkdir(join(root, 'lib'), { recursive: true });
  await Deno.writeTextFile(
    join(root, 'lib', 'orders.ts'),
    `import { createQueryFactories } from '@netscript/sdk/query';
import type { ContractProcedureLike, ContractSchema, ServiceClient } from '@netscript/sdk/client';

export interface Order { readonly id: string; readonly total: number }
type Schema<T> = ContractSchema & {
  readonly '~standard': { readonly types: { readonly input: T; readonly output: T } };
};
type Procedure<TInput, TOutput> = ContractProcedureLike<Schema<TInput>, Schema<TOutput>>;
declare const ordersContract: {
  readonly list: Procedure<Record<string, never>, readonly Order[]>;
};
declare const ordersClient: ServiceClient<typeof ordersContract>;
export const ordersQueries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
}).orders;
`,
  );
  await Deno.mkdir(join(root, 'components', 'ui'), { recursive: true });
  await Deno.writeTextFile(
    join(root, 'components', 'ui', 'mod.ts'),
    `export * from './components.tsx';
`,
  );
  await Deno.writeTextFile(
    join(root, 'components', 'ui', 'components.tsx'),
    `import type { ComponentChildren, JSX } from 'preact';

interface SurfaceProps extends JSX.HTMLAttributes<HTMLElement> {
  readonly children?: ComponentChildren;
}
function Surface(props: SurfaceProps) { return <section {...props}>{props.children}</section>; }
export const Card = Object.assign(Surface, {
  Header: Surface,
  Title: Surface,
  Description: Surface,
  Body: Surface,
});
export function Button(
  props: JSX.HTMLAttributes<HTMLButtonElement> & { readonly type?: 'button' | 'submit' | 'reset' },
) {
  return <button {...props}>{props.children}</button>;
}
interface FormFieldProps extends SurfaceProps {
  readonly label: string;
  readonly name: string;
  readonly required?: boolean;
  readonly error?: string;
}
export function FormField(props: FormFieldProps) { return <label>{props.children}</label>; }
export function Input(props: JSX.HTMLAttributes<HTMLInputElement> & { readonly error?: boolean }) {
  return <input {...props} />;
}
export function InlineNotice(
  props: SurfaceProps & { readonly variant: string; readonly title: string },
) { return <aside {...props}>{props.children}</aside>; }
export function getInputProps(
  _field: unknown,
  _options: unknown,
): JSX.HTMLAttributes<HTMLInputElement> { return {}; }
`,
  );
}
