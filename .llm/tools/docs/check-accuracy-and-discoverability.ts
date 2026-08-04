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

  const cliReference = await read('docs/site/cli-reference.md');
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
  const { code: driftCode, stderr: driftStderr, stdout: driftStdout } = await checkExportsCmd.output();
  if (driftCode !== 0) {
    console.error(new TextDecoder().decode(driftStdout));
    console.error(new TextDecoder().decode(driftStderr));
    throw new Error('Documentation exports/symbols drift check failed');
  }

  console.log(
    `docs accuracy: PASS (${publicDocs.length} saga pages, storefront worker boundary, spawn contract, 8 preferred paths, ${requiredMutationFamilies.length} CLI mutation families, ${checkedFreshRootImports} valid @netscript/fresh root imports checked)`,
  );
}

if (import.meta.main) {
  await runAccuracyCheck();
}
