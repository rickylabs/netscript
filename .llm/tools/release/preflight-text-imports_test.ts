import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
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
  const findings = await scanFile(new URL('positive-openapi-break.ts', fixtureRoot).pathname);
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'text-imports');
  assertEquals(findings[0].line, 6);
  if (findings[0].check === 'text-imports') {
    assertEquals(findings[0].declarationLine, 1);
  }
  assertStringIncludes(findings[0].message, 'scalarJsUrl');
});

Deno.test('preflight ignores URL constructors and generated constants without Deno reads', async () => {
  const findings = await scanFile(new URL('negative-url-composition.ts', fixtureRoot).pathname);
  assertEquals(findings, []);
});

Deno.test('preflight allowlist suppresses a single read line', async () => {
  const findings = await scanFile(new URL('allowlisted-read.ts', fixtureRoot).pathname);
  assertEquals(findings, []);
});

Deno.test('preflight flags eager fromFileUrl on import.meta.url', async () => {
  const findings = await scanFile(
    new URL('positive-file-url-import-meta.ts', fixtureRoot).pathname,
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].check, 'file-url-import-meta');
  assertEquals(findings[0].line, 3);
  assertStringIncludes(findings[0].message, 'https: import.meta.url');
});

Deno.test('preflight allows protocol-guarded fromFileUrl import.meta conversion', async () => {
  const findings = await scanFile(new URL('negative-guarded-file-url.ts', fixtureRoot).pathname);
  assertEquals(findings, []);
});
