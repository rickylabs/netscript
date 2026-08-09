/** Guards the documented preferred paths and CLI mutation map against surface drift. */

const root = new URL('../../../', import.meta.url);

async function read(path: string, base: URL = root): Promise<string> {
  return await Deno.readTextFile(new URL(path, base));
}

function requireText(text: string, needle: string, location: string): void {
  if (!text.includes(needle)) {
    throw new Error(`${location}: missing required accuracy marker ${JSON.stringify(needle)}`);
  }
}

function forbidText(text: string, needle: string, location: string): void {
  if (text.includes(needle)) {
    throw new Error(`${location}: contains forbidden stale claim ${JSON.stringify(needle)}`);
  }
}

export const ALLOWED_FRESH_ROOT_SYMBOLS: Set<string> = new Set([
  'CachedListEntryLike',
  'CacheEntryLike',
  'hasAllCacheEntries',
  'minCachedAt',
  'projectCachedItemFromList',
]);

const GOLDEN_PATH_QUERY_UTILS_PAGE = 'docs/site/reference/sdk/index.md';

export interface GoldenPathDocsResult {
  readonly pageCount: number;
  readonly queryUtilsPageCount: number;
}

/** Enforce the published golden-path module, alias, and query-dialect vocabulary. */
export async function checkGoldenPathDocs(
  dirPath = 'docs/site',
  rootUrl: URL = root,
): Promise<GoldenPathDocsResult> {
  const pages: Array<{ path: string; content: string }> = [];

  async function walk(path: string): Promise<void> {
    for await (const entry of Deno.readDir(new URL(path, rootUrl))) {
      const fullPath = `${path}/${entry.name}`;
      if (entry.isDirectory) {
        if (!entry.name.startsWith('_')) await walk(fullPath);
      } else if (entry.isFile && /\.(?:md|vto)$/.test(entry.name)) {
        pages.push({ path: fullPath, content: await read(fullPath, rootUrl) });
      }
    }
  }

  await walk(dirPath);
  const queryUtilsPages: string[] = [];
  for (const page of pages) {
    for (const forbidden of ['lib/api-clients.ts', '@contracts', '@/lib/']) {
      forbidText(page.content, forbidden, page.path);
    }
    if (/apps\/[^/\s`]+\/client\.ts/.test(page.content)) {
      throw new Error(`${page.path}: apps/<app>/client.ts is the CSS entry, not a data client`);
    }
    if (page.content.includes('createServiceQueryUtils')) queryUtilsPages.push(page.path);
  }

  if (
    queryUtilsPages.length !== 1 || queryUtilsPages[0] !== GOLDEN_PATH_QUERY_UTILS_PAGE
  ) {
    throw new Error(
      `createServiceQueryUtils must appear only in ${GOLDEN_PATH_QUERY_UTILS_PAGE}; found ${
        JSON.stringify(queryUtilsPages)
      }`,
    );
  }
  const queryUtilsReference = pages.find((page) => page.path === GOLDEN_PATH_QUERY_UTILS_PAGE);
  if (!queryUtilsReference) throw new Error(`${GOLDEN_PATH_QUERY_UTILS_PAGE}: page missing`);
  for (const marker of ['queryOptions({ input })', 'queryOptions(input)', 'no server KV tier']) {
    requireText(queryUtilsReference.content, marker, GOLDEN_PATH_QUERY_UTILS_PAGE);
  }

  return { pageCount: pages.length, queryUtilsPageCount: queryUtilsPages.length };
}

export async function checkFreshRootImports(dirPath: string, rootUrl: URL = root): Promise<number> {
  let count = 0;
  for await (const entry of Deno.readDir(new URL(dirPath, rootUrl))) {
    const fullPath = `${dirPath}/${entry.name}`;
    if (entry.isDirectory) {
      count += await checkFreshRootImports(fullPath, rootUrl);
    } else if (entry.isFile && entry.name.endsWith('.md')) {
      const content = await read(fullPath, rootUrl);
      const importMatches = content.matchAll(
        /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']@netscript\/fresh["']/g,
      );
      for (const match of importMatches) {
        const lineNumber = content.slice(0, match.index ?? 0).split('\n').length;
        const symbols = match[1]
          .split(',')
          .map((s) => s.trim().replace(/^type\s+/, ''))
          .filter(Boolean);
        for (const sym of symbols) {
          const cleanSym = sym.split(/\s+as\s+/)[0].trim();
          if (cleanSym && !ALLOWED_FRESH_ROOT_SYMBOLS.has(cleanSym)) {
            throw new Error(
              `${fullPath}:${lineNumber}: symbol '${cleanSym}' is imported from '@netscript/fresh' root, but it is not a valid root export. Use the appropriate subpath export instead.`,
            );
          }
        }
        count++;
      }
    }
  }
  return count;
}

export async function runAccuracyCheck(): Promise<void> {
  const sagaPagePaths = [
    'docs/site/durable-workflows/sagas.md',
    'docs/site/tutorials/storefront/04-checkout-saga.md',
    'docs/site/explanation/architecture.md',
    'docs/site/explanation/durability-model.md',
  ];
  const publicDocs = await Promise.all(sagaPagePaths.map((p) => read(p)));
  const sagaSource = await read('packages/plugin-sagas-core/src/builders/define-saga.ts');
  const sagaMessages = await read('packages/plugin-sagas-core/src/public/messages.ts');
  const sagaReference = await read('docs/site/reference/sagas/index.md');

  // Assert the public contract (an exported `defineSaga` whose first parameter is a bare id),
  // not an exact source spelling, so contract-preserving refactors do not trip the docs guard.
  if (!/export\s+function\s+defineSaga\s*</.test(sagaSource)) {
    throw new Error('defineSaga source: no exported generic `defineSaga` function found');
  }
  if (!/defineSaga\s*<[^>]*>\s*\(\s*id\s*:/.test(sagaSource)) {
    throw new Error('defineSaga source: `defineSaga` must take an `id` as its first parameter');
  }
  for (const [index, page] of publicDocs.entries()) {
    if (/defineSaga\s*\(\s*\{/.test(page)) {
      throw new Error(
        `${sagaPagePaths[index]}: defineSaga must start with an id, not an object`,
      );
    }
  }

  const storefront = publicDocs[1];
  const durableSagas = publicDocs[0];
  for (
    const orphanSend of [
      "send('CheckoutPaymentRequested'",
      "send('reserve-inventory'",
      "send('create-shipment'",
      "send('OrderCancelled'",
    ]
  ) {
    forbidText(storefront, orphanSend, sagaPagePaths[1]);
  }
  requireText(storefront, 'event.payload.body', sagaPagePaths[1]);
  forbidText(durableSagas, "{ kind: 'service', id: 'payments' }", sagaPagePaths[0]);
  requireText(durableSagas, 'type: "=> never"', sagaPagePaths[0]);
  requireText(sagaReference, 'options?: SpawnOptions): never', 'saga reference');

  const spawnSource = sagaMessages.slice(sagaMessages.indexOf('export function spawn('));
  if (!/^export function spawn\([\s\S]*?\): never \{/.test(spawnSource)) {
    throw new Error('saga messages source: public `spawn()` must return `never`');
  }
  requireText(spawnSource, "SagasError.notImplemented('Spawn cascades are unsupported.')", 'spawn');

  const howToIndex = await read('docs/site/how-to/index.md');
  for (
    const preferredPath of [
      'withResource',
      'useLiveQuery',
      'ui:add',
      'cloud-run',
      '@netscript/sdk/collections',
      '@netscript/sdk/query-client',
      'CacheQuery',
      'Scalar/OpenAPI',
    ]
  ) {
    requireText(howToIndex, preferredPath, 'how-to preferred-path index');
  }

  const quickstart = await read('docs/site/quickstart.vto');
  const cliReference = await read('docs/site/cli-reference.md');
  const addService = await read('docs/site/services-sdk/how-to/add-a-service.md');
  for (
    const [location, page] of [
      ['quickstart', quickstart],
      ['CLI reference', cliReference],
      ['add-a-service', addService],
    ] as const
  ) {
    requireText(page, '--with-client', location);
  }
  requireText(quickstart, 'Fresh client entry; imports app CSS', 'quickstart');
  requireText(quickstart, 'apps/dashboard/lib/orders.ts', 'quickstart');

  const goldenPathDocs = await checkGoldenPathDocs();

  requireText(cliReference, '## Mutation and regeneration map', 'CLI reference');
  // Column-set match rather than exact-line match: reformatting the table (spacing, alignment)
  // must not fail the guard, but dropping a column still does.
  const mapHeader = cliReference
    .split('\n')
    .find((line) => /^\s*\|/.test(line) && /Source of truth/.test(line));
  const mapColumns = mapHeader?.split('|').map((cell) => cell.trim()).filter(Boolean) ?? [];
  for (
    const column of [
      'Command',
      'Source of truth mutated',
      'Generated artifacts',
      'Runtime consumers',
      'Preview',
    ]
  ) {
    if (!mapColumns.includes(column)) {
      throw new Error(
        `CLI reference: mutation map is missing the ${JSON.stringify(column)} column`,
      );
    }
  }

  const requiredMutationFamilies = [
    'init',
    'config set',
    'contract add',
    'contract add-route',
    'contract version add',
    'service add',
    'service set',
    'service ref',
    'db add',
    'db init',
    'plugin install',
    'plugin update',
    'generate plugins',
    'generate runtime-schemas',
    'generate aspire',
    'ui:init',
    'ui:add',
    'deploy',
  ];
  for (const command of requiredMutationFamilies) {
    requireText(cliReference, `\`netscript ${command}`, 'CLI mutation map');
  }

  const checkedFreshRootImports = await checkFreshRootImports('docs');

  // Run the exports & symbols drift check as part of the accuracy verification
  const checkExportsCmd = new Deno.Command('deno', {
    args: ['run', '--allow-all', '.llm/tools/docs/check-exports-drift.ts'],
  });
  const { code: driftCode, stderr: driftStderr, stdout: driftStdout } = await checkExportsCmd
    .output();
  if (driftCode !== 0) {
    console.error(new TextDecoder().decode(driftStdout));
    console.error(new TextDecoder().decode(driftStderr));
    throw new Error('Documentation exports/symbols drift check failed');
  }

  console.log(
    `docs accuracy: PASS (${publicDocs.length} saga pages, ${goldenPathDocs.pageCount} published source pages, one query dialect exception page, storefront worker boundary, spawn contract, 8 preferred paths, ${requiredMutationFamilies.length} CLI mutation families, ${checkedFreshRootImports} valid @netscript/fresh root imports checked)`,
  );
}

if (import.meta.main) {
  await runAccuracyCheck();
}
