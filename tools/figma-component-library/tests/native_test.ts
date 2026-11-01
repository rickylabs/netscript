import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { generateLibrary } from '../src/generate.ts';
import { serializeLibrary } from '../src/validate-library.ts';
import { importLibrary } from '../src/native/import-library.ts';
import { exportLibrary } from '../src/native/export-library.ts';
import { DATA_KEYS, type NativeContext } from '../src/native/figma-port.ts';
import { fixtureCatalog, fixtureCollections, fixtureInput } from './fixture.ts';
import { MockFigma } from './mock-figma.ts';

function context(api: MockFigma): NativeContext {
  return { provenance: 'fixture', fileKey: api.fileKey, signal: new AbortController().signal };
}

Deno.test('native round trip inspects variants/parts/bindings, preserves exact identity and is idempotent', async () => {
  const sources = fixtureInput();
  const bundle = generateLibrary(sources);
  const api = new MockFigma(sources.collections);
  const sentinel = api.createFrame();
  sentinel.name = 'Existing hand-designed frame';
  const receipt = await importLibrary(api, bundle, sources, context(api));
  assertEquals(receipt.provenance, 'fixture');
  assertEquals(receipt.components.map((c) => [c.item, c.registryItem]), [[
    'example-button',
    'fixture-button',
  ]]);
  const result = await exportLibrary(api, bundle, sources, context(api));
  assertEquals(serializeLibrary(result.bundle), serializeLibrary(bundle));
  assertEquals(result.receipt, receipt);
  const count = api.mutations;
  assertEquals(await importLibrary(api, bundle, sources, context(api)), receipt);
  assertEquals(api.mutations, count);
  assertEquals(api.originalPage.children, [sentinel]);
  assertEquals(sentinel.name, 'Existing hand-designed frame');
  const page = api.root.children.find((p) => p.getPluginData(DATA_KEYS.owner));
  assert(page);
  const set = page.children[0];
  assert(set.type === 'COMPONENT_SET');
  assertEquals(set.children.length, 4);
  assertEquals(Object.keys(set.componentPropertyDefinitions).sort(), ['data-size', 'data-state']);
  const variant = set.children[0];
  assert(variant.type === 'COMPONENT');
  assertEquals(variant.variantProperties, { 'data-size': 'sm', 'data-state': 'rest' });
  assertEquals(variant.children.map((n) => n.name), [
    'part:label',
    'token:Theme set/radius/control',
    'token:Scheme/text/fg',
  ]);
  const swatch = variant.children[2];
  assert(swatch.type === 'FRAME');
  assertEquals(swatch.fills[0].color, { r: 18 / 255, g: 18 / 255, b: 18 / 255 });
});

Deno.test('invalid library and missing, ambiguous, mistyped or renamed native variables fail before mutation', async () => {
  const sources = fixtureInput();
  const bundle = generateLibrary(sources);
  const controls: readonly [((api: MockFigma) => void), string][] = [
    [(api) => {
      api.localVariables.pop();
    }, 'Missing or ambiguous native token binding'],
    [(api) => {
      api.localVariables.push(api.localVariables[0]);
    }, 'Missing or ambiguous native token binding'],
    [(api) => {
      api.localCollections.push(api.localCollections[0]);
    }, 'Missing or ambiguous native collection'],
    [(api) => {
      api.localCollections[0].modes[0].name = 'Unknown';
    }, 'Native mode mismatch'],
    [(api) => {
      api.localVariables[0] = { ...api.localVariables[0], resolvedType: 'FLOAT' };
    }, 'Native token identity/type/WEB mismatch'],
    [(api) => {
      api.localVariables[0] = { ...api.localVariables[0], codeSyntax: { WEB: 'var(--unknown)' } };
    }, 'Native token identity/type/WEB mismatch'],
  ];
  for (const [change, message] of controls) {
    const api = new MockFigma(sources.collections);
    change(api);
    await assertRejects(() => importLibrary(api, bundle, sources, context(api)), Error, message);
    assertEquals(api.mutations, 0);
    assertEquals(api.root.children.length, 1);
  }
  const api = new MockFigma(sources.collections);
  await assertRejects(
    () => importLibrary(api, { ...bundle, components: [] }, sources, context(api)),
    Error,
    'Library differs',
  );
  await assertRejects(
    () => importLibrary(api, bundle, sources, { ...context(api), fileKey: 'AnotherFileKey' }),
    Error,
    'file key mismatch',
  );
  assertEquals(api.mutations, 0);
  await assertRejects(
    () =>
      importLibrary(api, bundle, sources, {
        ...context(api),
        digest: () => Promise.resolve('invalid'),
      }),
    Error,
    'Invalid library digest',
  );
  assertEquals(api.mutations, 0);
});

Deno.test('runtime creation and reparent failures roll back owned nodes including original-page attachments', async () => {
  const sources = fixtureInput();
  const bundle = generateLibrary(sources);
  for (const failure of ['frame', 'reparent']) {
    const api = new MockFigma(sources.collections);
    const sentinel = api.createFrame();
    sentinel.name = 'Keep';
    if (failure === 'frame') api.failFrameAfter = 3;
    else api.failReparent = true;
    await assertRejects(() => importLibrary(api, bundle, sources, context(api)), Error, 'Mock');
    assertEquals(api.root.children, [api.originalPage]);
    assertEquals(api.originalPage.children, [sentinel]);
    assertEquals(sentinel.name, 'Keep');
  }
});

Deno.test('native export detects missing anatomy/variants, changed bindings, renamed identity and stale source', async () => {
  const sources = fixtureInput();
  const bundle = generateLibrary(sources);
  const controls: readonly [(api: MockFigma) => void, string][] = [
    [(api) => {
      api.root.children[1].children[0].remove();
    }, 'component coverage'],
    [(api) => {
      const set = api.root.children[1].children[0];
      assert(set.type === 'COMPONENT_SET');
      set.children[0].remove();
    }, 'variant coverage'],
    [(api) => {
      const set = api.root.children[1].children[0];
      assert(set.type === 'COMPONENT_SET');
      const variant = set.children[0];
      assert(variant.type === 'COMPONENT');
      variant.children[0].remove();
    }, 'anatomy/binding count'],
    [(api) => {
      const set = api.root.children[1].children[0];
      assert(set.type === 'COMPONENT_SET');
      const variant = set.children[0];
      assert(variant.type === 'COMPONENT');
      const carrier = variant.children[1];
      assert(carrier.type === 'FRAME');
      carrier.setBoundVariable('itemSpacing', null);
    }, 'node binding'],
    [(api) => {
      const set = api.root.children[1].children[0];
      assert(set.type === 'COMPONENT_SET');
      const variant = set.children[0];
      assert(variant.type === 'COMPONENT');
      const carrier = variant.children[2];
      assert(carrier.type === 'FRAME');
      carrier.fills = [{
        ...carrier.fills[0],
        boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'unknown-variable' } },
      }];
    }, 'paint binding'],
    [(api) => {
      const set = api.root.children[1].children[0];
      assert(set.type === 'COMPONENT_SET');
      const variant = set.children[0];
      assert(variant.type === 'COMPONENT');
      Object.defineProperty(variant, 'boundVariables', {
        value: { width: { type: 'VARIABLE_ALIAS', id: 'unmapped' } },
      });
    }, 'unknown node binding'],
    [(api) => {
      api.root.children[1].children[0].setPluginData(DATA_KEYS.item, '{}');
    }, 'registry identity'],
    [(api) => {
      api.root.children[1].setPluginData(DATA_KEYS.hash, 'stale');
    }, 'source hash'],
  ];
  for (const [change, message] of controls) {
    const api = new MockFigma(sources.collections);
    await importLibrary(api, bundle, sources, context(api));
    change(api);
    const before = api.mutations;
    await assertRejects(() => exportLibrary(api, bundle, sources, context(api)), Error, message);
    await assertRejects(() => importLibrary(api, bundle, sources, context(api)), Error, message);
    assertEquals(api.mutations, before);
  }
});

Deno.test('single components, STRING/BOOLEAN bindings, font preflight and cancellation retain their boundaries', async () => {
  const catalog = fixtureCatalog();
  const extra = {
    ...fixtureInput(),
    catalog: {
      ...catalog,
      components: catalog.components.map((c, i) =>
        i === 0
          ? { ...c, attributes: {}, tokenRoles: [...c.tokenRoles, 'font/fixture', 'deco/fixture'] }
          : c
      ),
    },
    collections: [...fixtureCollections(), {
      collection: 'Density',
      modes: ['Default'],
      variables: [
        {
          name: 'font/fixture',
          type: 'STRING',
          scopes: ['ALL_SCOPES'],
          values: { Default: 'Inter' },
        },
        {
          name: 'deco/fixture',
          type: 'BOOLEAN',
          scopes: ['ALL_SCOPES'],
          values: { Default: true },
        },
      ],
    }],
  };
  const bundle = generateLibrary(extra);
  const api = new MockFigma(extra.collections);
  await importLibrary(api, bundle, extra, context(api));
  assertEquals(api.root.children[1].children[0].type, 'COMPONENT');
  assertEquals((await exportLibrary(api, bundle, extra, context(api))).bundle, bundle);
  const missingFont = new MockFigma(extra.collections);
  missingFont.failFont = true;
  await assertRejects(
    () => importLibrary(missingFont, bundle, extra, context(missingFont)),
    Error,
    'unavailable font',
  );
  assertEquals(missingFont.mutations, 0);
  const aborted = new MockFigma(extra.collections);
  await assertRejects(
    () =>
      importLibrary(aborted, bundle, extra, {
        ...context(aborted),
        signal: AbortSignal.abort(new Error('Cancelled')),
      }),
    Error,
    'Cancelled',
  );
  assertEquals(aborted.mutations, 0);
});
