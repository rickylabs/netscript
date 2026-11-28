import { assertEquals, assertThrows } from '@std/assert';
import { join } from '@std/path';
import { analyzeNpmCatalogCompliance, parseArgs } from './scan-npm-catalog-compliance.ts';
import { collectWorkspaceFacts, type DependencyUse, hasFail } from './workspace.ts';

const MEMBER = {
  name: '@netscript/example',
  root: 'packages/example',
  denoJsonPath: 'packages/example/deno.json',
  packageJsonPath: 'packages/example/package.json',
  publishable: true,
};

Deno.test('parseArgs accepts repeatable --fail-on-package-prefix forms and rejects empty values', () => {
  assertEquals(
    parseArgs([
      '--json',
      '--fail-on-package-prefix=@orpc/',
      '--fail-on-package-prefix',
      '@tanstack/',
    ]),
    {
      json: true,
      failOnViolation: false,
      failOnPackagePrefixes: ['@orpc/', '@tanstack/'],
    },
  );
  assertThrows(() => parseArgs(['--fail-on-package-prefix=']));
  assertThrows(() => parseArgs(['--fail-on-package-prefix']));
  assertThrows(() => parseArgs(['--fail-on-package-prefix', '--json']));
});

Deno.test('fail-on-package-prefix fails strictly on matching packages while leaving unrelated warnings non-fatal', () => {
  const catalog = {
    '@orpc/server': '^1.16.6',
    'preact': '^10.29.8',
  };
  const uses: DependencyUse[] = [
    {
      registry: 'npm',
      name: '@orpc/server',
      range: '^1.16.6',
      raw: 'npm:@orpc/server@^1.16.6',
      source: 'deno.imports',
      member: MEMBER,
      path: 'packages/example/deno.json',
      line: 10,
    },
    {
      registry: 'npm',
      name: 'preact',
      range: '^10.29.8',
      raw: 'npm:preact@^10.29.8',
      source: 'deno.imports',
      member: MEMBER,
      path: 'packages/example/deno.json',
      line: 11,
    },
  ];

  const scoped = analyzeNpmCatalogCompliance(uses, catalog, {
    json: false,
    failOnViolation: false,
    failOnPackagePrefixes: ['@orpc/'],
  });
  assertEquals(scoped.length, 2);
  assertEquals(scoped[0].level, 'FAIL');
  assertEquals(scoped[1].level, 'WARN');
  assertEquals(hasFail(scoped), true);

  const unrelatedOnly = analyzeNpmCatalogCompliance([uses[1]], catalog, {
    json: false,
    failOnViolation: false,
    failOnPackagePrefixes: ['@orpc/'],
  });
  assertEquals(unrelatedOnly.length, 1);
  assertEquals(unrelatedOnly[0].level, 'WARN');
  assertEquals(hasFail(unrelatedOnly), false);
});

Deno.test('deno.json catalog: entries pass when backed by root catalog and fail when missing', () => {
  const uses: DependencyUse[] = [
    {
      registry: 'npm',
      name: '@orpc/contract',
      range: '^1.16.6',
      raw: 'catalog:',
      source: 'deno.imports',
      member: MEMBER,
      path: 'packages/example/deno.json',
      line: 8,
      catalogVersion: '^1.16.6',
    },
    {
      registry: 'npm',
      name: '@orpc/missing',
      range: '',
      raw: 'catalog:',
      source: 'deno.imports',
      member: MEMBER,
      path: 'packages/example/deno.json',
      line: 9,
      catalogVersion: undefined,
    },
  ];
  const findings = analyzeNpmCatalogCompliance(uses, { '@orpc/contract': '^1.16.6' }, {
    json: false,
    failOnViolation: false,
    failOnPackagePrefixes: ['@orpc/'],
  });
  assertEquals(findings.length, 1);
  assertEquals(findings[0].level, 'FAIL');
  assertEquals(
    findings[0].message,
    'packages/example declares @orpc/missing as catalog: but the root catalog has no matching entry',
  );
});

Deno.test('collectWorkspaceFacts skips nested standalone deno.json fixtures and avoids duplicate nested member scans', async () => {
  const root = await Deno.makeTempDir({ prefix: 'npm-catalog-compliance-' });
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        workspace: ['packages/*', 'packages/cli/e2e'],
        catalog: { '@orpc/server': '^1.16.6' },
      }),
    );
    await Deno.mkdir(join(root, 'packages/cli/e2e/fixtures/standalone/src'), { recursive: true });
    await Deno.writeTextFile(
      join(root, 'packages/cli/deno.json'),
      JSON.stringify({ name: '@test/cli', imports: { '@orpc/server': 'catalog:' } }),
    );
    await Deno.writeTextFile(
      join(root, 'packages/cli/e2e/deno.json'),
      JSON.stringify({ name: '@test/cli-e2e', imports: { '@orpc/server': 'catalog:' } }),
    );
    await Deno.writeTextFile(
      join(root, 'packages/cli/e2e/probe.ts'),
      "import { os } from 'npm:@orpc/server@^1.16.6';\nvoid os;\n",
    );
    // Standalone fixture with its own deno.json is NOT a workspace member and must not be flagged.
    await Deno.writeTextFile(
      join(root, 'packages/cli/e2e/fixtures/standalone/deno.json'),
      JSON.stringify({
        name: '@test/standalone-fixture',
        imports: { '@orpc/server': 'npm:@orpc/server@^1.16.6' },
      }),
    );
    await Deno.writeTextFile(
      join(root, 'packages/cli/e2e/fixtures/standalone/src/router.ts'),
      "import { os } from 'npm:@orpc/server@^1.16.6';\nvoid os;\n",
    );

    const facts = await collectWorkspaceFacts(root);
    const findings = analyzeNpmCatalogCompliance(facts.dependencies, facts.catalog, {
      json: false,
      failOnViolation: false,
      failOnPackagePrefixes: ['@orpc/'],
    });
    // Only packages/cli/e2e/probe.ts is flagged, and exactly once (not duplicated under packages/cli).
    assertEquals(findings.length, 1);
    assertEquals(findings[0].path, 'packages/cli/e2e/probe.ts');
    assertEquals(findings[0].level, 'FAIL');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
