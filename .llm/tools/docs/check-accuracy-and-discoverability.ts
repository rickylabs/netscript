/** Guards genuinely textual documentation policy against surface drift. */

import { resolve } from '@std/path';

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

export const FORBIDDEN_GOLDEN_PATH_TERMS: readonly string[] = [
  'lib/api-clients.ts',
  '@contracts',
  '@/lib/',
];

/** Apply the golden-path vocabulary policy to one source or shipped-corpus document. */
export function checkForbiddenGoldenPathTerms(text: string, location: string): void {
  for (const forbidden of FORBIDDEN_GOLDEN_PATH_TERMS) {
    forbidText(text, forbidden, location);
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

/** The complete Markdown corpus accepted as public command documentation. */
export const COMMAND_REFERENCE_PATHS: readonly string[] = [
  'docs/site/reference/cli/commands.md',
  'docs/site/cli-reference.md',
];

/** Ratified root plus direct-child command census for the current public tree. */
export const EXPECTED_PUBLIC_DIRECT_COMMAND_COUNT = 91;

export interface GoldenPathDocsResult {
  readonly pageCount: number;
  readonly queryUtilsPageCount: number;
}

export interface CommandReferenceResult {
  readonly auditedCount: number;
  readonly documentedCount: number;
  readonly recursiveCount: number;
  readonly missing: readonly string[];
}

/** Audit root/direct-child command coverage against the locked Markdown corpus. */
export function auditPublicCommandReference(
  recursiveCommandPaths: readonly string[],
  markdownSources: readonly string[],
): CommandReferenceResult {
  const catalogPaths = [
    ...new Set(recursiveCommandPaths.map((path) => path.trim()).filter(Boolean)),
  ]
    .sort();
  const rootPaths = catalogPaths.filter((path) => commandDepth(path) === 1);
  const directPaths = catalogPaths.filter((path) => commandDepth(path) === 2);
  const auditedPaths = [...rootPaths, ...directPaths].sort();
  const resolvedInvocations = markdownSources.flatMap((source) =>
    resolveDocumentedInvocations(source, catalogPaths)
  );
  const documented = new Set<string>();

  for (const rootPath of rootPaths) {
    if (
      markdownSources.some((source) => hasStructuralRootDeclaration(source, rootPath)) ||
      resolvedInvocations.includes(rootPath)
    ) {
      documented.add(rootPath);
    }
  }
  for (const directPath of directPaths) {
    if (
      resolvedInvocations.some((resolvedPath) =>
        resolvedPath === directPath || resolvedPath.startsWith(`${directPath} `)
      )
    ) {
      documented.add(directPath);
    }
  }

  const missing = auditedPaths
    .filter((path) => !documented.has(path))
    .map(renderCommandPath);
  return {
    auditedCount: auditedPaths.length,
    documentedCount: auditedPaths.length - missing.length,
    recursiveCount: catalogPaths.length,
    missing,
  };
}

/** Fail when the live command census or locked-corpus coverage drifts. */
export function checkPublicCommandReference(
  recursiveCommandPaths: readonly string[],
  markdownSources: readonly string[],
  expectedCount: number = EXPECTED_PUBLIC_DIRECT_COMMAND_COUNT,
): CommandReferenceResult {
  const result = auditPublicCommandReference(recursiveCommandPaths, markdownSources);
  if (result.auditedCount !== expectedCount) {
    const lead = result.missing.length > 0
      ? `; unratified command path(s): ${result.missing.join(', ')}`
      : `; audited paths: ${
        deriveAuditedPaths(recursiveCommandPaths).map(renderCommandPath).join(', ')
      }`;
    throw new Error(
      `public command census expected ${expectedCount}, got ${result.auditedCount}${lead}`,
    );
  }
  if (result.missing.length > 0) {
    throw new Error(
      `public command reference covers ${result.documentedCount}/${result.auditedCount}; missing ${
        result.missing.join(', ')
      }`,
    );
  }
  return result;
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
    checkForbiddenGoldenPathTerms(page.content, page.path);
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
  const commandReferenceSources = await Promise.all(
    COMMAND_REFERENCE_PATHS.map((path) => read(path)),
  );
  const commandReference = checkPublicCommandReference(
    await listPublicCommandPaths(),
    commandReferenceSources,
  );
  const goldenPathDocs = await checkGoldenPathDocs();
  const shippedCorpus = await readShippedAgentDocsCorpus();
  for (const [path, content] of Object.entries(shippedCorpus.files)) {
    checkForbiddenGoldenPathTerms(content, `.llm/assets/agent-docs/prose.json.gz:${path}`);
  }
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
    `docs accuracy: PASS (${publicDocs.length} saga pages checked for stale claims, ${goldenPathDocs.pageCount} published source pages, ${
      Object.keys(shippedCorpus.files).length
    } shipped corpus files, one query dialect exception page, mutation-map columns, ${commandReference.documentedCount}/${commandReference.auditedCount} root/direct public commands from ${commandReference.recursiveCount} recursive paths, ${checkedFreshRootImports} valid @netscript/fresh root imports checked)`,
  );
}

async function readShippedAgentDocsCorpus(): Promise<{
  readonly schemaVersion: 1;
  readonly files: Readonly<Record<string, string>>;
}> {
  const compressed = await Deno.readFile(
    new URL('.llm/assets/agent-docs/prose.json.gz', root),
  );
  const copied = new Uint8Array(compressed.byteLength);
  copied.set(compressed);
  const stream = new Blob([copied.buffer]).stream().pipeThrough(
    new DecompressionStream('gzip'),
  );
  return JSON.parse(await new Response(stream).text());
}

/** Materialize the live public CLI registry through its recursive catalog adapter. */
export async function listPublicCommandPaths(): Promise<readonly string[]> {
  interface PublicCliHost {
    readonly cwd: () => string;
    readonly resolvePath: (path?: string) => string;
  }
  interface EnumerableCommand {
    readonly getName: () => string;
    readonly getDescription: () => string;
    readonly getCommands: () => readonly EnumerableCommand[];
  }
  interface PublicTreeModule {
    readonly createPublicCommandRegistry: () => {
      readonly program: (input: Record<string, unknown>) => EnumerableCommand;
    };
  }
  interface PublicDependenciesModule {
    readonly createPublicCommandDependencies: (host: PublicCliHost) => unknown;
  }
  interface PublicCatalogModule {
    readonly PublicCliCommandCatalog: new (root: EnumerableCommand) => {
      readonly listCommands: () => Promise<readonly { readonly path: string }[]>;
    };
  }

  const treeUrl = new URL(
    '../../../packages/cli/src/public/features/root/public-command-tree.ts',
    import.meta.url,
  ).href;
  const dependenciesUrl = new URL(
    '../../../packages/cli/src/public/features/root/public-command-dependencies.ts',
    import.meta.url,
  ).href;
  const catalogUrl = new URL(
    '../../../packages/cli/src/public/features/agent/mcp/cli-mcp-adapters.ts',
    import.meta.url,
  ).href;
  const [treeModule, dependenciesModule, catalogModule] = await Promise.all([
    import(treeUrl) as Promise<PublicTreeModule>,
    import(dependenciesUrl) as Promise<PublicDependenciesModule>,
    import(catalogUrl) as Promise<PublicCatalogModule>,
  ]);
  const host: PublicCliHost = {
    cwd: () => Deno.cwd(),
    resolvePath: (path) => resolve(Deno.cwd(), path ?? '.'),
  };
  const rootCommand = treeModule.createPublicCommandRegistry().program({
    name: 'netscript',
    version: 'docs-accuracy',
    description: 'Public command documentation accuracy check',
    context: {
      host,
      dependencies: dependenciesModule.createPublicCommandDependencies(host),
    },
  });
  return (await new catalogModule.PublicCliCommandCatalog(rootCommand).listCommands()).map(
    ({ path }) => path,
  );
}

function resolveDocumentedInvocations(
  markdown: string,
  catalogPaths: readonly string[],
): readonly string[] {
  const catalogTokens = catalogPaths
    .map((path) => ({ path, tokens: path.split(' ') }))
    .sort((left, right) => right.tokens.length - left.tokens.length);
  const resolved: string[] = [];
  for (
    const match of markdown.matchAll(
      /\bnetscript[ \t]+([a-z0-9][a-z0-9:-]*(?:[ \t]+[a-z0-9][a-z0-9:-]*)*)/gi,
    )
  ) {
    const tokens = match[1].toLowerCase().split(/[ \t]+/);
    const command = catalogTokens.find(({ tokens: commandTokens }) =>
      commandTokens.every((token, index) => tokens[index] === token)
    );
    if (command) resolved.push(command.path);
  }
  return resolved;
}

function hasStructuralRootDeclaration(markdown: string, rootPath: string): boolean {
  const escaped = escapeRegExp(rootPath);
  return new RegExp(
    `^#{1,6}[ \\t]+\\\`${escaped}\\\`(?:[ \\t]+—.*)?$`,
    'im',
  ).test(markdown);
}

function deriveAuditedPaths(recursiveCommandPaths: readonly string[]): readonly string[] {
  return [...new Set(recursiveCommandPaths.map((path) => path.trim()).filter(Boolean))]
    .filter((path) => commandDepth(path) <= 2)
    .sort();
}

function commandDepth(path: string): number {
  return path.split(' ').length;
}

function renderCommandPath(path: string): string {
  return `netscript ${path}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (import.meta.main) {
  await runAccuracyCheck();
}
