import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { scanFile } from './preflight-text-imports.ts';

const fixtureRoot = new URL('./tests/fixtures/', import.meta.url);

Deno.test('preflight flags cross-line import.meta-relative reads', async () => {
  const findings = await scanFile(new URL('positive-openapi-break.ts', fixtureRoot).pathname);
  assertEquals(findings.length, 1);
  assertEquals(findings[0].line, 6);
  assertEquals(findings[0].declarationLine, 1);
  assertStringIncludes(findings[0].message, 'scalarJsUrl');
});

Deno.test('preflight ignores URL constructors and text imports without Deno reads', async () => {
  const findings = await scanFile(new URL('negative-url-composition.ts', fixtureRoot).pathname);
  assertEquals(findings, []);
});

Deno.test('preflight allowlist suppresses a single read line', async () => {
  const findings = await scanFile(new URL('allowlisted-read.ts', fixtureRoot).pathname);
  assertEquals(findings, []);
});
