import { assertEquals, assertThrows } from '@std/assert';
import {
  CACHE_FIRST_LOADER_DOC_PATHS,
  checkCacheFirstLoaderDocs,
} from './cache-first-loader-docs.ts';

const siteRoot = new URL('../../../docs/site/', import.meta.url);

async function readSources(): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      CACHE_FIRST_LOADER_DOC_PATHS.map(async (path) => [
        path,
        await Deno.readTextFile(new URL(path, siteRoot)),
      ]),
    ),
  );
}

function withPage(
  sources: Record<string, string>,
  path: string,
  edit: (source: string) => string,
): Record<string, string> {
  const edited = edit(sources[path]);
  if (edited === sources[path]) throw new Error(`fixture edit did not change ${path}`);
  return { ...sources, [path]: edited };
}

/** The pre-#1670 homepage loader: metadata read first, cold fallback through `queryFn()`. */
const PREVIOUS_HOMEPAGE_LOADER = String
  .raw`      // Server-only: getCachedEntry uses the registered cache provider.\n      const entry = await usersQueries.list.getCachedEntry(input);\n      if (entry) return { users: entry.data, cachedAt: entry.cachedAt };\n      return {\n        users: await usersQueries.list.queryOptions(input).queryFn(),\n        cachedAt: Date.now(),\n      };\n`;

function currentHomepageLoader(source: string): string {
  const start = source.indexOf(String.raw`      // Server-only: the action owns cache policy`);
  const end = source.indexOf(String.raw`        : { users, cachedAt: Date.now() };\n`, start);
  if (start < 0 || end < 0) throw new Error('homepage loader fixture anchor moved');
  return source.slice(start, end + String.raw`        : { users, cachedAt: Date.now() };\n`.length);
}

function sectionRemoved(source: string, heading: string, nextHeading: string): string {
  const start = source.indexOf(heading);
  const end = source.indexOf(nextHeading, start);
  if (start < 0 || end < 0) throw new Error(`fixture anchor ${heading} moved`);
  return source.slice(0, start) + source.slice(end);
}

Deno.test('published cache-first loader docs satisfy the #1670 contract', async () => {
  assertEquals(checkCacheFirstLoaderDocs(await readSources()), 4);
});

Deno.test('previous homepage loader (metadata read, queryFn fallback) is rejected', async () => {
  const sources = await readSources();
  const previous = withPage(
    sources,
    'index.vto',
    (source) => source.replace(currentHomepageLoader(source), PREVIOUS_HOMEPAGE_LOADER),
  );
  assertThrows(
    () => checkCacheFirstLoaderDocs(previous),
    Error,
    'index.vto: loader does not run await usersQueries.list(input, { preferFreshOnStale: true })',
  );
});

Deno.test('a metadata read placed before the callable action is rejected', async () => {
  const sources = await readSources();
  const reordered = withPage(sources, 'index.vto', (source) => {
    const action = 'await usersQueries.list(input, { preferFreshOnStale: true })';
    const metadata = 'await usersQueries.list.getCachedEntry(input)';
    return source.replace(action, '\u0000').replace(metadata, action).replace('\u0000', metadata);
  });
  assertThrows(
    () => checkCacheFirstLoaderDocs(reordered),
    Error,
    'index.vto: metadata read precedes the callable action',
  );
});

Deno.test('previous tutorial chapter 4 (bare read, no stated reason) is rejected', async () => {
  const sources = await readSources();
  const path = 'tutorials/live-dashboard/04-definePage-QueryIsland.md';
  const previous = withPage(
    sources,
    path,
    (source) => sectionRemoved(source, '`ordersData` is a bare', '`definePage` comes from'),
  );
  assertThrows(() => checkCacheFirstLoaderDocs(previous), Error, `${path}: bare read lacks`);
});

Deno.test('the retracted first-paint guarantee in chapter 4 is rejected', async () => {
  const sources = await readSources();
  const path = 'tutorials/live-dashboard/04-definePage-QueryIsland.md';
  const evaluatedHead = withPage(sources, path, (source) =>
    source.replace(
      'action-then-metadata loader:',
      'action-then-metadata loader, so first paint never waits on `orders`:',
    ));
  assertThrows(
    () => checkCacheFirstLoaderDocs(evaluatedHead),
    Error,
    `${path}: contains retracted claim "first paint never waits"`,
  );
});

Deno.test('previous layers page (bare read, no stated reason) is rejected', async () => {
  const sources = await readSources();
  const previous = withPage(
    sources,
    'web-layer/layers.md',
    (source) =>
      sectionRemoved(source, 'The loader is a bare metadata read', '`staleReloadMode` decides'),
  );
  assertThrows(
    () => checkCacheFirstLoaderDocs(previous),
    Error,
    'web-layer/layers.md: bare read lacks its stated reason',
  );
});

Deno.test('previous SDK guide (no warm-stale caveat) is rejected', async () => {
  const sources = await readSources();
  const previous = withPage(
    sources,
    'services-sdk/sdk.md',
    (source) =>
      sectionRemoved(source, '### When a stale refresh cannot persist', '## Safe error narrowing'),
  );
  assertThrows(
    () => checkCacheFirstLoaderDocs(previous),
    Error,
    'services-sdk/sdk.md: missing warm-stale caveat section',
  );
});

Deno.test('a warm-stale caveat without the freshest-value guidance is rejected', async () => {
  const sources = await readSources();
  const edited = withPage(
    sources,
    'services-sdk/sdk.md',
    (source) => source.replace('returns `data` itself.', 'is out of scope.'),
  );
  assertThrows(() => checkCacheFirstLoaderDocs(edited), Error, 'warm-stale caveat lacks');
});

Deno.test('an exempted warm-stale example fence is rejected', async () => {
  const sources = await readSources();
  const exempted = withPage(sources, 'services-sdk/sdk.md', (source) => {
    const fence = source.indexOf("```ts\nimport type { CachedEntry } from '@netscript/sdk/cache';");
    if (fence < 0) throw new Error('warm-stale example fence anchor moved');
    return `${source.slice(0, fence)}\`\`\`ts no-check:illustrative${source.slice(fence + 5)}`;
  });
  assertThrows(
    () => checkCacheFirstLoaderDocs(exempted),
    Error,
    'services-sdk/sdk.md: warm-stale example must be a compiled ts fence, not exempt',
  );
});

Deno.test('a missing registered page is reported instead of crashing', () => {
  assertThrows(() => checkCacheFirstLoaderDocs({}), Error, 'index.vto: page source missing');
});
