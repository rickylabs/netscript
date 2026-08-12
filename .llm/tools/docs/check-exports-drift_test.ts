import { assertEquals } from '@std/assert';
import {
  checkExportsDrift,
  deriveExpectedExports,
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
