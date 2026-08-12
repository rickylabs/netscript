/** Guards genuinely textual documentation policy against surface drift. */

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

/** Keep forbidden saga vocabulary out of the public guides. */
export function checkSagaVocabulary(
  publicDocs: readonly string[],
  sagaPagePaths: readonly string[],
): void {
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
  forbidText(durableSagas, "{ kind: 'service', id: 'payments' }", sagaPagePaths[0]);
}

/** Require the mutation-map heading and policy columns, independent of table formatting. */
export function checkMutationMapColumns(cliReference: string): void {
  requireText(cliReference, '## Mutation and regeneration map', 'CLI reference');
  const mapHeader = cliReference
    .split('\n')
    .find((line) => /^\s*\|/.test(line) && /Command/.test(line));
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
}

export async function runAccuracyCheck(): Promise<void> {
  const sagaPagePaths = [
    'docs/site/durable-workflows/sagas.md',
    'docs/site/tutorials/storefront/04-checkout-saga.md',
    'docs/site/explanation/architecture.md',
    'docs/site/explanation/durability-model.md',
  ];
  const publicDocs = await Promise.all(sagaPagePaths.map((p) => read(p)));
  checkSagaVocabulary(publicDocs, sagaPagePaths);

  const cliReference = await read('docs/site/cli-reference.md');
  const goldenPathDocs = await checkGoldenPathDocs();
  checkMutationMapColumns(cliReference);

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
    `docs accuracy: PASS (${publicDocs.length} saga pages checked for stale claims, ${goldenPathDocs.pageCount} published source pages, one query dialect exception page, mutation-map columns, ${checkedFreshRootImports} valid @netscript/fresh root imports checked)`,
  );
}

if (import.meta.main) {
  await runAccuracyCheck();
}
