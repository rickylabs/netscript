import { assertEquals } from '@std/assert';
import { join, relative } from '@std/path';
import {
  checkDrift,
  checkExportsDrift,
  deriveExpectedExports,
  type PackageMapping,
  parseDocContent,
} from './check-exports-drift.ts';

Deno.test('drift checker negative fixture validation', () => {
  const packageName = '@netscript/plugin';
  const pkgName = 'plugin';
  const docPath = 'docs/site/reference/plugin/index.md';

  // 1. Arrange: added export, but not in doc (should fail)
  const mockExports = {
    '.': './mod.ts',
    './new-feature': './src/new-feature.ts',
  };
  const mockDocContent = `
# @netscript/plugin

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| @netscript/plugin | ./mod.ts | Main entrypoint |
`;

  const expectedExports = deriveExpectedExports(packageName, mockExports, []);
  const { docExports } = parseDocContent(mockDocContent);
  const errors = checkExportsDrift(pkgName, docPath, expectedExports, docExports);

  assertEquals(errors.length, 1);
  assertEquals(
    errors[0],
    "Drift Error [plugin]: Document at docs/site/reference/plugin/index.md OMITS exported entrypoint '@netscript/plugin/new-feature' (./src/new-feature.ts)",
  );

  // 2. Arrange: added export, but explicitly excluded (should pass)
  const expectedExportsExcluded = deriveExpectedExports(packageName, mockExports, [
    './new-feature',
  ]);
  const errorsExcluded = checkExportsDrift(pkgName, docPath, expectedExportsExcluded, docExports);
  assertEquals(errorsExcluded.length, 0);

  // 3. Arrange: added export, and properly documented in doc (should pass)
  const mockDocContentDocumented = `
# @netscript/plugin

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| @netscript/plugin | ./mod.ts | Main entrypoint |
| @netscript/plugin/new-feature | ./src/new-feature.ts | New feature description |
`;
  const { docExports: docExportsDocumented } = parseDocContent(mockDocContentDocumented);
  const errorsDocumented = checkExportsDrift(
    pkgName,
    docPath,
    expectedExports,
    docExportsDocumented,
  );
  assertEquals(errorsDocumented.length, 0);
});

Deno.test('symbol parsing is table-aware and normalizes display generics', () => {
  const { docSymbols } = parseDocContent(`
| Symbol | Kind |
| --- | --- |
| \`DataGridColumn<T>\` / \`Alpha\` | types |

| Prop | Type |
| --- | --- |
| \`columns\` | array |

| Field | Type |
| --- | --- |
| \`key\` | string |
`);
  assertEquals([...docSymbols].sort(), ['Alpha', 'DataGridColumn']);
});

function fixtureMapping(symbolCoverage: unknown): unknown {
  return [{
    name: 'fixture',
    packagePath: 'unused',
    docPath: 'unused',
    packageName: '@netscript/fixture',
    excludedExports: [],
    symbolCoverage,
  }];
}

Deno.test('drift checker refuses an empty or malformed coverage reason', async () => {
  assertEquals(
    await checkDrift(fixtureMapping({ mode: 'entrypoints-only', reason: '   ' })),
    1,
  );
  assertEquals(
    await checkDrift(fixtureMapping({ mode: 'entrypoints-only', reason: 42 })),
    1,
  );
});

Deno.test('drift checker refuses an unknown coverage mode', async () => {
  const code = await checkDrift(fixtureMapping({ mode: 'unknown', reason: 'fixture policy' }));
  assertEquals(code, 1);
});

async function withSymbolFixture(
  documentedSymbols: readonly string[],
  run: (mapping: readonly PackageMapping[]) => Promise<void>,
): Promise<void> {
  const scratchRoot = join(Deno.cwd(), '.llm/tmp');
  await Deno.mkdir(scratchRoot, { recursive: true });
  const fixtureRoot = await Deno.makeTempDir({ dir: scratchRoot, prefix: 'exports-drift-test-' });
  const packageRoot = join(fixtureRoot, 'pkg');
  const docPath = join(fixtureRoot, 'reference.md');
  await Deno.mkdir(packageRoot);
  try {
    await Deno.writeTextFile(
      join(packageRoot, 'deno.json'),
      JSON.stringify({ exports: { '.': './mod.ts' } }),
    );
    await Deno.writeTextFile(
      join(packageRoot, 'mod.ts'),
      '/** Fixture export. */\nexport const actualSymbol: string = "actual";\n',
    );
    const symbolRows = documentedSymbols.map((symbol) =>
      `| \`${symbol}\` | fixture | Fixture symbol. |`
    ).join('\n');
    await Deno.writeTextFile(
      docPath,
      `# Fixture\n\n## Exports\n\n| Export | Entrypoint | Purpose |\n| --- | --- | --- |\n| @netscript/fixture | ./mod.ts | Fixture entrypoint. |\n\n---\n\n## Symbols\n\n| Symbol | Kind | Description |\n| --- | --- | --- |\n${symbolRows}\n`,
    );

    const relativeRoot = relative(Deno.cwd(), fixtureRoot);
    await run([{
      name: 'fixture',
      packagePath: join(relativeRoot, 'pkg'),
      docPath: join(relativeRoot, 'reference.md'),
      packageName: '@netscript/fixture',
      excludedExports: [],
      symbolCoverage: {
        mode: 'complete',
        reason: 'Fixture requires complete symbol coverage.',
      },
    }]);
  } finally {
    await Deno.remove(fixtureRoot, { recursive: true });
  }
}

Deno.test('drift checker refuses an invented symbol through the injectable seam', async () => {
  await withSymbolFixture(['inventedSymbol'], async (mapping) => {
    assertEquals(await checkDrift(mapping), 1);
  });
});

Deno.test('drift checker refuses an omitted symbol through the injectable seam', async () => {
  await withSymbolFixture([], async (mapping) => {
    assertEquals(await checkDrift(mapping), 1);
  });
});
