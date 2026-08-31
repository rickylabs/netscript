import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { join } from '@std/path';
import {
  checkAspireScaffoldVersionDocs,
  checkForbiddenGoldenPathTerms,
  checkFreshRootImports,
  checkGoldenPathDocs,
  checkMutationMapColumns,
  checkPublicCommandReference,
  checkSagaVocabulary,
} from './check-accuracy-and-discoverability.ts';

Deno.test('Aspire scaffold docs track the live CLI version pins', async () => {
  const [explanation, deployLocal] = await Promise.all([
    Deno.readTextFile(new URL('../../../docs/site/explanation/aspire.md', import.meta.url)),
    Deno.readTextFile(
      new URL(
        '../../../docs/site/orchestration-runtime/how-to/deploy-local-aspire.md',
        import.meta.url,
      ),
    ),
  ]);

  checkAspireScaffoldVersionDocs(explanation, deployLocal);
});

Deno.test('shipped-corpus vocabulary check rejects every golden-path stale term', () => {
  checkForbiddenGoldenPathTerms('apps/storefront/lib/catalog.ts', 'corpus:clean.md');
  for (const stale of ['lib/api-clients.ts', '@contracts', '@/lib/orders.ts']) {
    assertThrows(
      () => checkForbiddenGoldenPathTerms(stale, 'corpus:stale.md'),
      Error,
      stale.includes('@/lib/') ? '@/lib/' : stale,
    );
  }
});

Deno.test('checkFreshRootImports allows valid root imports and fails on invalid root import with file, line, and symbol diagnostics', async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const docsDir = join(tempDir, 'docs');
    await Deno.mkdir(docsDir, { recursive: true });

    const validMd = `# Valid Doc
Some intro text.

\`\`\`ts
import { CacheEntryLike } from '@netscript/fresh';
\`\`\`
`;
    await Deno.writeTextFile(join(docsDir, 'valid.md'), validMd);

    const count = await checkFreshRootImports('docs', new URL(`file://${tempDir}/`));
    assertEquals(count, 1);

    const invalidMd = `# Invalid Doc
Line 2
Line 3
import { InvalidFreshSymbol } from '@netscript/fresh';
Line 5
`;
    await Deno.writeTextFile(join(docsDir, 'invalid.md'), invalidMd);

    const error = await assertRejects(
      () => checkFreshRootImports('docs', new URL(`file://${tempDir}/`)),
      Error,
    );

    assertEquals(
      error.message,
      "docs/invalid.md:4: symbol 'InvalidFreshSymbol' is imported from '@netscript/fresh' root, but it is not a valid root export. Use the appropriate subpath export instead.",
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('checkGoldenPathDocs rejects retired paths, aliases, and query dialect drift', async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const site = join(tempDir, 'docs/site');
    const reference = join(site, 'reference/sdk');
    await Deno.mkdir(reference, { recursive: true });
    await Deno.writeTextFile(
      join(reference, 'index.md'),
      'createServiceQueryUtils is the reference-only query dialect.\n',
    );
    await Deno.writeTextFile(join(site, 'guide.md'), '# clean guide\n');

    assertEquals(
      await checkGoldenPathDocs('docs/site', new URL(`file://${tempDir}/`)),
      { pageCount: 2, queryUtilsPageCount: 1 },
    );

    for (
      const [content, expected] of [
        ['lib/api-clients.ts', 'lib/api-clients.ts'],
        ['@contracts', '@contracts'],
        ['@/lib/orders.ts', '@/lib/'],
      ] as const
    ) {
      await Deno.writeTextFile(join(site, 'guide.md'), content);
      await assertRejects(
        () => checkGoldenPathDocs('docs/site', new URL(`file://${tempDir}/`)),
        Error,
        expected,
      );
    }
    await Deno.writeTextFile(join(site, 'guide.md'), 'createServiceQueryUtils');
    await assertRejects(
      () => checkGoldenPathDocs('docs/site', new URL(`file://${tempDir}/`)),
      Error,
      'must appear only',
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('checkSagaVocabulary rejects stale builder and orphan worker claims', () => {
  const paths = ['sagas.md', 'storefront.md', 'architecture.md', 'durability.md'];
  checkSagaVocabulary(['clean', 'clean', 'clean', 'clean'], paths);

  for (
    const stale of [
      'defineSaga({ id: "checkout" })',
      "send('CheckoutPaymentRequested'",
      "send('reserve-inventory'",
      "send('create-shipment'",
      "send('OrderCancelled'",
      "{ kind: 'service', id: 'payments' }",
    ]
  ) {
    const pages = ['clean', 'clean', 'clean', 'clean'];
    pages[stale.startsWith('send(') ? 1 : 0] = stale;
    assertThrows(() => checkSagaVocabulary(pages, paths), Error);
  }
});

Deno.test('checkMutationMapColumns requires the heading and all five policy columns', () => {
  const columns =
    '| Command | Source of truth mutated | Generated artifacts | Runtime consumers | Preview |';
  checkMutationMapColumns(`## Mutation and regeneration map\n\n${columns}\n`);

  for (
    const missing of [
      'Command',
      'Source of truth mutated',
      'Generated artifacts',
      'Runtime consumers',
      'Preview',
    ]
  ) {
    assertThrows(
      () =>
        checkMutationMapColumns(
          `## Mutation and regeneration map\n\n${columns.replace(missing, 'Removed')}\n`,
        ),
      Error,
      missing,
    );
  }
});

Deno.test('public command coverage uses structural roots, direct-parent projection, and colon roots', () => {
  const paths = [
    'agent',
    'agent drift',
    'agent drift record',
    'agent init',
    'ui:add',
  ];
  const result = checkPublicCommandReference(paths, [
    [
      '## `agent` — agent tooling',
      '`netscript agent init` installs tooling.',
      '`netscript agent drift record` records drift.',
      '`netscript ui:add` copies a registry item.',
    ].join('\n'),
    '# Curated companion\n',
  ], 4);
  assertEquals(result, {
    auditedCount: 4,
    documentedCount: 4,
    recursiveCount: 5,
    missing: [],
  });
});

Deno.test('public command coverage does not credit a descendant or sibling to a missing path', () => {
  const paths = ['agent', 'agent init', 'agent mcp'];
  assertThrows(
    () =>
      checkPublicCommandReference(paths, [
        'The command `netscript agent init` installs tooling.\n',
        'No group heading is present.\n',
      ], 3),
    Error,
    'missing netscript agent, netscript agent mcp',
  );
});

Deno.test('public command census drift names the newly appeared undocumented path', () => {
  assertThrows(
    () =>
      checkPublicCommandReference(
        ['agent', 'agent init', 'agent mcp'],
        ['## `agent`\n`netscript agent init`\n'],
        2,
      ),
    Error,
    'expected 2, got 3; unratified command path(s): netscript agent mcp',
  );
});
