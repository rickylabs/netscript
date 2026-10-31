import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { collections } from '../../../packages/fresh-ui/src/tokens/assets/figma.generated.ts';
import {
  exportFigmaTokenBundle,
  importFigmaTokenBundle,
} from '../../../packages/fresh-ui/src/tokens/adapters/figma-round-trip.ts';
import { validateRegistryItem } from '../../../packages/fresh-ui/registry-v2.ts';
import { importSnapshot } from '../src/import-snapshot.ts';
import { exportSnapshot } from '../src/snapshot.ts';
import { assertValuesOnly, pushThemePullRequest } from '../src/github-export.ts';
import { themeItem } from '../src/theme-item.ts';
import { fixtureFigma, MockFigma, modifiedFixture } from './mock-figma.ts';

Deno.test('two-pass import restores the fixture in an empty file and preserves existing IDs', async () => {
  const api = new MockFigma();
  await importSnapshot(api, collections);
  assertEquals(
    await exportSnapshot(api),
    collections.map((collection) => collection).sort((a, b) =>
      Object.keys(expectedOrder).indexOf(a.collection) -
      Object.keys(expectedOrder).indexOf(b.collection)
    ),
  );
  const ids = api.variables.map((variable) => variable.id);
  const primitive = api.variables.find((variable) => variable.name === 'color/amber/d/1')!;
  primitive.setVariableCodeSyntax('WEB', 'stale syntax');
  await importSnapshot(api, modifiedFixture(collections));
  assertEquals(api.variables.map((variable) => variable.id), ids);
  assertEquals(primitive.codeSyntax.WEB, undefined);
  const snapshot = await exportSnapshot(api);
  assertEquals(
    snapshot.find((collection) => collection.collection === 'Scheme')!.variables.find((variable) =>
      variable.name === 'bevel/edge'
    )!.values.Light,
    '#2233441a',
  );
});
const expectedOrder = {
  Primitives: '',
  Theme: '',
  'Base accent': '',
  Scheme: '',
  Density: '',
  'Base gray': '',
  'Studio flavor': '',
  'Theme B': '',
  'Theme set': '',
};

Deno.test('name, mode, type and cycle failures cause zero Figma mutations', async () => {
  const api = fixtureFigma(collections);
  const badMode = collections.map((collection, c) =>
    c === 0 ? { ...collection, modes: ['unknown'] } : collection
  );
  await assertRejects(() => importSnapshot(api, badMode));
  const target = collections.find((collection) => collection.collection === 'Theme set')!;
  const variable = target.variables[0];
  const cycle = collections.map((collection) =>
    collection === target
      ? {
        ...collection,
        variables: collection.variables.map((entry) =>
          entry === variable
            ? {
              ...entry,
              values: { ...entry.values, A: { alias: `${target.collection}/${variable.name}` } },
            }
            : entry
        ),
      }
      : collection
  );
  await assertRejects(() => importSnapshot(api, cycle), Error, 'alias cycle');
  assertEquals(api.mutations, 0);
});

Deno.test('Scheme + Theme proof changes only values in the complete portable registry item', () => {
  const baseline = themeItem(collections, 'studio-utility');
  const changed = themeItem(modifiedFixture(collections), 'studio-utility');
  validateRegistryItem(changed);
  assertValuesOnly(baseline, changed);
  assertThrows(
    () => assertValuesOnly(baseline, { ...changed, title: 'renamed' }),
    Error,
    'metadata changes',
  );
  assertThrows(() => assertValuesOnly(baseline, baseline), Error, 'No token values changed');
  assertThrows(
    () =>
      assertValuesOnly({
        ...baseline,
        valueMetadata: { $value: 'before', oklch: 'before' },
      }, { ...changed, valueMetadata: { $value: 'after', oklch: 'after' } }),
    Error,
    'metadata changes',
  );
  assertEquals(
    importFigmaTokenBundle(
      (changed.meta!.netscript as { figma: unknown }).figma,
    ),
    modifiedFixture(collections),
  );
});

Deno.test('DTCG retains an explicit ff alpha byte and normalizes near-opaque API values', async () => {
  const input = collections.map((collection) => ({
    ...collection,
    variables: collection.variables.map((variable) =>
      collection.collection === 'Scheme' && variable.name === 'bevel/edge'
        ? { ...variable, values: { ...variable.values, Light: '#223344ff' } }
        : variable
    ),
  }));
  assertEquals(importFigmaTokenBundle(exportFigmaTokenBundle(input)), input);
  const api = new MockFigma();
  await importSnapshot(api, input);
  const native = await exportSnapshot(api);
  assertEquals(
    native.find((entry) => entry.collection === 'Scheme')!.variables.find((entry) =>
      entry.name === 'bevel/edge'
    )!.values.Light,
    '#223344ff',
  );
});

Deno.test('GitHub creates one tree file and one PR after validating the baseline; token never enters bodies', async () => {
  const previous = themeItem(collections, 'studio-utility');
  const next = themeItem(modifiedFixture(collections), 'studio-utility');
  let compactBaseline = false;
  let reorderedBaseline = false;
  const mutations: { path: string; body: string }[] = [];
  const sha = 'a'.repeat(40);
  const request: typeof fetch = (value, init) => {
    const url = new URL(String(value));
    assertEquals(url.origin, 'https://api.github.com');
    assertEquals(new Headers(init?.headers).get('Authorization'), 'Bearer private-test-token');
    const path = url.pathname.replace(/^\/repos\/owner\/themes\/?/, '');
    const body = String(init?.body ?? '');
    assert(!body.includes('private-test-token'));
    if (init?.method === 'POST') {
      mutations.push({ path, body });
      return Promise.resolve(
        Response.json(
          path === 'pulls' ? { html_url: 'https://github.com/owner/themes/pull/1' } : { sha },
        ),
      );
    }
    return Promise.resolve(
      Response.json(
        path === ''
          ? { default_branch: 'main' }
          : path === 'git/ref/heads/main'
          ? { object: { sha } }
          : path.startsWith('git/commits/')
          ? { tree: { sha } }
          : path.startsWith('contents/')
          ? { sha }
          : {
            encoding: 'base64',
            content: new TextEncoder().encode(
              compactBaseline ? JSON.stringify(previous) : JSON.stringify(
                reorderedBaseline
                  ? Object.fromEntries(Object.entries(previous).reverse())
                  : previous,
                null,
                2,
              ) + '\n',
            ).toBase64(),
          },
      ),
    );
  };
  const url = await pushThemePullRequest({
    repository: 'owner/themes',
    token: 'private-test-token',
    branch: 'figma/test',
    path: 'themes/studio-utility.json',
    item: next,
  }, request);
  assertStringIncludes(url, '/pull/1');
  assertEquals(mutations.map((entry) => entry.path), [
    'git/blobs',
    'git/trees',
    'git/commits',
    'git/refs',
    'pulls',
  ]);
  assertEquals(JSON.parse(mutations[1].body).tree.length, 1);
  assertEquals(JSON.parse(mutations[1].body).tree[0].path, 'themes/studio-utility.json');
  mutations.length = 0;
  await assertRejects(() =>
    pushThemePullRequest({
      repository: 'owner/themes',
      token: 'private-test-token',
      branch: 'figma/test',
      path: 'themes/studio-utility.json',
      item: { ...next, title: 'changed' },
    }, request)
  );
  assertEquals(mutations, []);
  compactBaseline = true;
  await assertRejects(
    () =>
      pushThemePullRequest({
        repository: 'owner/themes',
        token: 'private-test-token',
        branch: 'figma/test',
        path: 'themes/studio-utility.json',
        item: next,
      }, request),
    Error,
    'canonical export format',
  );
  compactBaseline = false;
  reorderedBaseline = true;
  await assertRejects(
    () =>
      pushThemePullRequest({
        repository: 'owner/themes',
        token: 'private-test-token',
        branch: 'figma/test',
        path: 'themes/studio-utility.json',
        item: next,
      }, request),
    Error,
    'metadata changes',
  );
  assertEquals(mutations, []);
});
