import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import { scanFile, scanSource } from './preflight-text-imports.ts';

Deno.test('preflight rejects import attributes in publishable source', () => {
  const findings = scanSource(
    `import readme from './README.md' with { type: 'text' };`,
    'seeded-import-attribute.ts',
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'import-attributes');
  assertEquals(findings[0].line, 1);
  assertStringIncludes(findings[0].message, 'generated TypeScript constant');
  assertStringIncludes(findings[0].message, 'https://github.com/denoland/deno/issues/35546');
  assertStringIncludes(findings[0].message, 'authenticated canary publish');
});

Deno.test('preflight ignores import-attribute text in inert source regions', () => {
  const findings = scanSource(
    [
      `const quoted = "with { type: 'json' }";`,
      `const emitted = \`import data from './data.json' with { type: 'json' };\`;`,
      `// with { type: 'text' }`,
      `/* with { type: 'json' } */`,
    ].join('\n'),
    'inert-import-attribute-text.ts',
  );
  assertEquals(findings, []);
});

const fixtureRoot = new URL('./tests/fixtures/', import.meta.url);

Deno.test('preflight flags cross-line import.meta-relative reads', async () => {
  const findings = await scanFile(fromFileUrl(new URL('positive-openapi-break.ts', fixtureRoot)));
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'text-imports');
  assertEquals(findings[0].line, 6);
  if (findings[0].check === 'text-imports') {
    assertEquals(findings[0].declarationLine, 1);
  }
  assertStringIncludes(findings[0].message, 'scalarJsUrl');
});

Deno.test('preflight ignores URL constructors and generated constants without Deno reads', async () => {
  const findings = await scanFile(fromFileUrl(new URL('negative-url-composition.ts', fixtureRoot)));
  assertEquals(findings, []);
});

Deno.test('text-read checks ignore quoted emitted source and retain executable reads', () => {
  for (const read of ['readTextFile', 'readFile']) {
    for (
      const expression of [
        `await Deno.${read}(new URL('./asset.txt', import.meta.url));`,
        `const assetUrl = new URL('./asset.txt', import.meta.url); await Deno.${read}(assetUrl);`,
      ]
    ) {
      for (
        const literal of [
          JSON.stringify(expression),
          `'${expression.replaceAll("'", "\\'")}'`,
        ]
      ) {
        const source = `const emitted = ${literal};\n${expression}`;
        const findings = scanSource(source, 'embedded.generated.ts');
        assertEquals(findings.length, 1);
        assertEquals(findings[0].check, 'text-imports');
        assertEquals(findings[0].line, 2);
      }
    }
  }
});

Deno.test('quoted URL declarations do not classify an unrelated executable read', () => {
  const declaration = `const assetUrl = new URL('./asset.txt', import.meta.url);`;
  const findings = scanSource(
    [
      `const emitted = ${JSON.stringify(declaration)};`,
      'const assetUrl = suppliedByCaller;',
      'await Deno.readTextFile(assetUrl);',
    ].join('\n'),
    'embedded-declaration.ts',
  );
  assertEquals(findings, []);
});

Deno.test('text-read checks retain executable template interpolations', () => {
  const findings = scanSource(
    'const emitted = `${await Deno.readFile(new URL("./asset.txt", import.meta.url))}`;',
    'template-read.ts',
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'text-imports');
});

Deno.test('regex quotes cannot hide executable reads or URL declarations', () => {
  for (const read of ['readTextFile', 'readFile']) {
    for (const pattern of ["/'/", '/"/', '/[`\'"]/']) {
      for (
        const expression of [
          `await Deno.${read}(new URL("./asset.txt", import.meta.url));`,
          `const assetUrl = new URL("./asset.txt", import.meta.url); await Deno.${read}(assetUrl);`,
        ]
      ) {
        const findings = scanSource(
          `const pattern = ${pattern};\n${expression}`,
          'regex-before-read.ts',
        );
        assertEquals(findings.length, 1);
        assertEquals(findings[0].check, 'text-imports');
        assertEquals(findings[0].line, 2);
      }
    }
  }
});

Deno.test('division and regex literals do not turn generated source into executable syntax', () => {
  const expression = 'await Deno.readTextFile(new URL("./asset.txt", import.meta.url));';
  const findings = scanSource(
    [
      'const ratio = numerator / denominator;',
      'const pattern = /[\'"`]/;',
      `const emitted = ${JSON.stringify(expression)};`,
      expression,
    ].join('\n'),
    'mixed-source.ts',
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].line, 4);
});

Deno.test('regex quotes also preserve the file URL and import attribute guards', () => {
  const fileUrl = scanSource(
    "const pattern = /'/;\nconst root = fromFileUrl(import.meta.url);",
    'regex-before-file-url.ts',
  );
  assertEquals(fileUrl.length, 1);
  assertEquals(fileUrl[0].check, 'file-url-import-meta');
  const attribute = scanSource(
    "const pattern = /'/;\nimport asset from './asset.txt' with { type: 'text' };",
    'regex-before-import.ts',
  );
  assertEquals(attribute.length, 1);
  assertEquals(attribute[0].check, 'import-attributes');
});

Deno.test('unclassifiable syntax does not suppress an executable read', () => {
  const findings = scanSource(
    'const incomplete = ;\nawait Deno.readFile(new URL("asset.txt", import.meta.url));',
    'invalid-syntax.ts',
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'text-imports');
  assertEquals(findings[0].line, 2);
});

Deno.test('preflight allowlist suppresses a single read line', async () => {
  const findings = await scanFile(fromFileUrl(new URL('allowlisted-read.ts', fixtureRoot)));
  assertEquals(findings, []);
});

Deno.test('preflight flags eager fromFileUrl on import.meta.url', async () => {
  const findings = await scanFile(
    fromFileUrl(new URL('positive-file-url-import-meta.ts', fixtureRoot)),
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'file-url-import-meta');
  assertEquals(findings[0].line, 3);
  assertStringIncludes(findings[0].message, 'https: import.meta.url');
});

Deno.test('preflight ignores embedded string source but still flags following executable code', () => {
  const findings = scanSource(
    [
      `const generated = "const label = \\"canary\\"; fromFileUrl(import.meta.url);";`,
      `const root = fromFileUrl(import.meta.url);`,
    ].join('\n'),
    'agent-tools.generated.ts',
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'file-url-import-meta');
  assertEquals(findings[0].line, 2);
});

Deno.test('preflight still flags executable code in a template interpolation', () => {
  const findings = scanSource(
    'const root = `${fromFileUrl(import.meta.url)}`;',
    'template-interpolation.ts',
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'file-url-import-meta');
});

Deno.test('preflight allows protocol-guarded fromFileUrl import.meta conversion', async () => {
  const findings = await scanFile(
    fromFileUrl(new URL('negative-guarded-file-url.ts', fixtureRoot)),
  );
  assertEquals(findings, []);
});

Deno.test('release:preflight task argv accepts a bare separator', async () => {
  const script = new URL('./preflight-text-imports.ts', import.meta.url);
  const fixture = new URL('negative-url-composition.ts', fixtureRoot);
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-read', fromFileUrl(script), '--', '--file', fromFileUrl(fixture)],
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  assertEquals(new TextDecoder().decode(output.stderr), '');
  assertEquals(output.code, 0);
  assertStringIncludes(
    new TextDecoder().decode(output.stdout),
    'release:preflight text-imports — PASS',
  );
});

Deno.test('file-url check ignores embedded string data but still fails on real syntax', () => {
  // #1145: `agent-tools.generated.ts` embeds every `.llm/tools` module as a double-quoted
  // constant so `agent init` can write them into a consumer project. The published module never
  // executes that data, but matching it blocked every 0.0.4 cut.
  const embedded = [
    'export const AGENT_TOOLS: Record<string, string> = {',
    `  'e2e/scaffold-e2e-test.ts':`,
    `    "import { fromFileUrl } from 'jsr:@std/path@1';\\nconst root = fromFileUrl(import.meta.url);\\n",`,
    '};',
  ].join('\n');
  const embeddedFindings = scanSource(
    embedded,
    'packages/cli/src/kernel/assets/agent-tools.generated.ts',
  )
    .filter((finding) => finding.check === 'file-url-import-meta');
  assertEquals(embeddedFindings.length, 0);

  // The ban must still fire on genuine module syntax — a fix that only proves the pass
  // direction would disable the guard it is meant to preserve.
  const real = [
    `import { fromFileUrl } from 'jsr:@std/path@1';`,
    'const root = fromFileUrl(import.meta.url);',
  ].join('\n');
  const realFindings = scanSource(real, 'packages/cli/src/kernel/real.ts')
    .filter((finding) => finding.check === 'file-url-import-meta');
  assertEquals(realFindings.length, 1);
});
