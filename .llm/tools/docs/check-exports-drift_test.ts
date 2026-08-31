import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
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

Deno.test('derives a root export from the string exports form', () => {
  assertEquals(
    deriveExpectedExports('@netscript/fixture', './mod.ts'),
    new Map([['@netscript/fixture', './mod.ts']]),
  );
});

Deno.test('derives record exports from string and default targets', () => {
  assertEquals(
    deriveExpectedExports('@netscript/fixture', {
      '.': './mod.ts',
      './conditional': { default: './conditional.ts' },
    }),
    new Map([
      ['@netscript/fixture', './mod.ts'],
      ['@netscript/fixture/conditional', './conditional.ts'],
    ]),
  );
});

Deno.test('uses an empty path when a conditional export has no default', () => {
  assertEquals(
    deriveExpectedExports('@netscript/fixture', { './conditional': {} }),
    new Map([['@netscript/fixture/conditional', '']]),
  );
});

Deno.test('preserves the empty fallback for a falsy default', () => {
  assertEquals(
    deriveExpectedExports('@netscript/fixture', { './conditional': { default: '' } }),
    new Map([['@netscript/fixture/conditional', '']]),
  );
  assertEquals(
    deriveExpectedExports('@netscript/fixture', { './malformed': { default: false } }),
    new Map([['@netscript/fixture/malformed', '']]),
  );
});

Deno.test('uses an empty path for a null export target instead of throwing', () => {
  assertEquals(
    deriveExpectedExports('@netscript/fixture', { './malformed': null }),
    new Map([['@netscript/fixture/malformed', '']]),
  );
});

Deno.test('refuses a malformed top-level exports value', () => {
  assertThrows(
    () => deriveExpectedExports('@netscript/fixture', 42),
    TypeError,
    'Deno exports must be a string or a record',
  );
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

interface CapturedCheck {
  code: number;
  errors: string[];
}

async function checkDriftCapturingErrors(mapping: unknown): Promise<CapturedCheck> {
  const originalError = console.error;
  const errors: string[] = [];
  console.error = (...args: unknown[]) => {
    errors.push(args.map((arg) => String(arg)).join(' '));
  };
  try {
    return { code: await checkDrift(mapping), errors };
  } finally {
    console.error = originalError;
  }
}

function assertSingleRefusal(result: CapturedCheck, expectedCause: string): void {
  assertEquals(result.code, 1);
  assertEquals(result.errors.length, 1);
  assertStringIncludes(result.errors[0], expectedCause);
  assertEquals(result.errors[0].includes('Failed to read'), false);
}

function withCoverage(mapping: readonly PackageMapping[], symbolCoverage: unknown): unknown {
  return mapping.map((candidate) => ({ ...candidate, symbolCoverage }));
}

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
  await withSymbolFixture(['actualSymbol', 'inventedSymbol'], async (mapping) => {
    const result = await checkDriftCapturingErrors(mapping);
    assertSingleRefusal(
      result,
      "INVENTS nonexistent/unexported symbol 'inventedSymbol'",
    );
  });
});

Deno.test('drift checker refuses an omitted symbol through the injectable seam', async () => {
  await withSymbolFixture([], async (mapping) => {
    const result = await checkDriftCapturingErrors(mapping);
    assertSingleRefusal(result, "OMITS exported symbol 'actualSymbol'");
  });
});

Deno.test('drift checker refuses an empty or malformed coverage reason', async () => {
  await withSymbolFixture(['actualSymbol'], async (mapping) => {
    for (const reason of ['   ', 42]) {
      const result = await checkDriftCapturingErrors(
        withCoverage(mapping, { mode: 'entrypoints-only', reason }),
      );
      assertSingleRefusal(
        result,
        'mapping[0].symbolCoverage.reason must be a nonempty string',
      );
    }
  });
});

Deno.test('drift checker refuses an unknown coverage mode', async () => {
  await withSymbolFixture(['actualSymbol'], async (mapping) => {
    const result = await checkDriftCapturingErrors(
      withCoverage(mapping, { mode: 'unknown', reason: 'fixture policy' }),
    );
    assertSingleRefusal(
      result,
      "mapping[0].symbolCoverage.mode is unknown: 'unknown'",
    );
  });
});
