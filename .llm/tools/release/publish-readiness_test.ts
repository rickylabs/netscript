import { assert, assertEquals } from 'jsr:@std/assert@^1';
import {
  auditFirstPublishPackages,
  auditLockstepAndResidue,
  collectPublishReadiness,
  type PublishReadinessDependencies,
  type ReadinessCheckEvidence,
} from './publish-readiness.ts';
import { scanNetscriptJsrSpecifiers } from '../validation/check-netscript-jsr-specifiers.ts';
import type { PublishSetAuditResult } from './preflight-release.ts';

const MEMBER = { path: 'packages/new', name: '@netscript/new' } as const;

Deno.test('publish readiness emits ordered structured evidence for every composed check', async () => {
  const report = await collectPublishReadiness('/repo', '0.0.2-canary.1', dependencies());
  assertEquals(report.ok, true);
  assertEquals(report.checks.map(({ id, status }) => ({ id, status })), [
    { id: 'publish-set', status: 'PASS' },
    { id: 'markdown-pins', status: 'PASS' },
    { id: 'lockstep-residue', status: 'PASS' },
    { id: 'versionless-specifiers', status: 'PASS' },
    { id: 'new-packages', status: 'PASS' },
    { id: 'first-publish', status: 'PASS' },
    { id: 'provisioning-dry-check', status: 'PASS' },
    { id: 'import-attribute-preflight', status: 'PASS' },
  ]);
  assert(report.checks.every((check) => Number.isInteger(check.durationMs)));
});

Deno.test('publish readiness fails on a seeded workspace member omitted from the publish set', async () => {
  const missing = { path: 'plugins/new', name: '@netscript/plugin-new' };
  const report = await collectPublishReadiness(
    '/repo',
    '0.0.2-canary.1',
    dependencies({ auditPublishSet: () => Promise.resolve(publishSet([missing])) }),
  );
  assertFailed(report.checks, 'publish-set', 'MISSING @netscript/plugin-new');
});

Deno.test('publish readiness preserves the seeded stale Markdown pin gate', async () => {
  const report = await collectPublishReadiness(
    '/repo',
    '0.0.2-canary.1',
    dependencies({
      auditMarkdownPins: () =>
        Promise.resolve({
          violations: [{
            path: 'README.md',
            line: 4,
            packageName: '@netscript/cli',
            pinnedVersion: '0.0.1-beta.9',
            deferred: false,
          }],
          deferred: [],
        }),
    }),
  );
  assertFailed(report.checks, 'markdown-pins', 'README.md:4');
});

Deno.test('lockstep and residue audit fails on seeded manifest and internal specifier versions', async () => {
  const root = await versionFixture();
  try {
    await Deno.writeTextFile(
      `${root}/packages/new/deno.json`,
      JSON.stringify({
        name: '@netscript/new',
        version: '0.0.2-canary.0',
        imports: { '@netscript/other': 'jsr:@netscript/other@^0.0.2-canary.0' },
      }),
    );
    const findings = await auditLockstepAndResidue(root, '0.0.2-canary.1');
    assert(findings.some((finding) => finding.message.includes('manifest version')));
    assert(findings.some((finding) => finding.message.includes('retains 0.0.2-canary.0')));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('lockstep audit ignores seeded fixture scaffold versions outside the release surface', async () => {
  const root = await versionFixture();
  try {
    const fixture = `${root}/packages/new/tests/fixtures/scaffold.plugin.json`;
    await Deno.mkdir(`${root}/packages/new/tests/fixtures`, { recursive: true });
    await Deno.writeTextFile(fixture, JSON.stringify({ name: 'fixture', version: '1.0.0' }));
    assertEquals(await auditLockstepAndResidue(root, '0.0.2-canary.1'), []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('publish readiness fails on a seeded versionless framework specifier', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-readiness-versionless-' });
  try {
    await Deno.mkdir(`${root}/packages/new`, { recursive: true });
    await Deno.mkdir(`${root}/plugins`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/packages/new/mod.ts`,
      "export const generated = 'jsr:@netscript/contracts';\n",
    );
    const report = await collectPublishReadiness(
      root,
      '0.0.2-canary.1',
      dependencies({ scanSpecifiers: scanNetscriptJsrSpecifiers }),
    );
    assertFailed(report.checks, 'versionless-specifiers', 'must include a version');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('first-publish checklist fails on a seeded missing README', async () => {
  const root = await firstPublishFixture({ readme: false });
  try {
    const violations = await auditFirstPublishPackages(root, [MEMBER]);
    assert(violations.some((finding) => finding.rule === 'readme-missing'));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('first-publish checklist fails over-cap tagline, missing license/exports, and docs pointer', async () => {
  const root = await firstPublishFixture({
    tagline: `**${'enterprise '.repeat(30)}**`,
    license: false,
    exports: false,
    docs: false,
  });
  try {
    const rules = (await auditFirstPublishPackages(root, [MEMBER])).map((finding) => finding.rule);
    assert(rules.includes('tagline-bytes'));
    assert(rules.includes('license'));
    assert(rules.includes('exports'));
    assert(rules.includes('docs-reference'));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('publish readiness fails when seeded first-publish provisioning dry-check fails', async () => {
  const report = await collectPublishReadiness(
    '/repo',
    '0.0.2-canary.1',
    dependencies({
      readRegistryVersions: () => Promise.resolve(null),
      runProvisioningDryCheck: () => Promise.reject(new Error('repository link missing')),
    }),
  );
  assertFailed(report.checks, 'provisioning-dry-check', 'repository link missing');
});

Deno.test('new-package evidence enumerates only registry-absent members', async () => {
  const existing = { path: 'packages/existing', name: '@netscript/existing' };
  let audited: readonly string[] = [];
  const report = await collectPublishReadiness(
    '/repo',
    '0.0.2-canary.1',
    dependencies({
      auditPublishSet: () =>
        Promise.resolve({
          intended: [MEMBER, existing],
          effective: [MEMBER, existing],
          excluded: [],
          missing: [],
          extra: [],
        }),
      readRegistryVersions: (name) => Promise.resolve(name === MEMBER.name ? null : ['0.0.1']),
      auditFirstPublish: (_root, members) => {
        audited = members.map((member) => member.name);
        return Promise.resolve([]);
      },
    }),
  );
  assertEquals(report.ok, true);
  assertEquals(audited, [MEMBER.name]);
  assertEquals(
    report.checks.find((check) => check.id === 'new-packages')?.details,
    [`${MEMBER.name} (${MEMBER.path})`],
  );
});

Deno.test('registry failure skips dependent first-publish checks instead of using a partial set', async () => {
  let calls = 0;
  const second = { path: 'packages/two', name: '@netscript/two' };
  const report = await collectPublishReadiness(
    '/repo',
    '0.0.2-canary.1',
    dependencies({
      readRegistryVersions: () => {
        calls++;
        return calls === 1 ? Promise.resolve(null) : Promise.reject(new Error('registry timeout'));
      },
      auditPublishSet: () =>
        Promise.resolve({
          intended: [MEMBER, second],
          effective: [MEMBER, second],
          excluded: [],
          missing: [],
          extra: [],
        }),
    }),
  );
  assertFailed(report.checks, 'new-packages', 'registry timeout');
  assertEquals(report.checks.find((check) => check.id === 'first-publish')?.status, 'SKIP');
  assertEquals(
    report.checks.find((check) => check.id === 'provisioning-dry-check')?.status,
    'SKIP',
  );
});

Deno.test('publish readiness calls canonical preflight for a seeded text import and carries #810 sunset', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-readiness-import-attribute-' });
  try {
    const seeded = `${root}/seeded.ts`;
    await Deno.writeTextFile(seeded, "import text from './asset.txt' with { type: 'text' };\n");
    const report = await collectPublishReadiness(
      root,
      '0.0.2-canary.1',
      dependencies({
        runCanonicalPreflight: async () => {
          const source = await Deno.readTextFile(seeded);
          if (source.includes("with { type: 'text' }")) {
            throw new Error('seeded import-attribute violation');
          }
        },
      }),
    );
    assertFailed(report.checks, 'import-attribute-preflight', 'seeded import-attribute violation');
    assertFailed(report.checks, 'import-attribute-preflight', 'denoland/deno#35546');
    assertFailed(report.checks, 'import-attribute-preflight', 'authenticated canary');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

function dependencies(
  overrides: Partial<PublishReadinessDependencies> = {},
): PublishReadinessDependencies {
  return {
    auditPublishSet: () => Promise.resolve(publishSet()),
    auditMarkdownPins: () => Promise.resolve({ violations: [], deferred: [] }),
    auditVersions: () => Promise.resolve([]),
    scanSpecifiers: () => Promise.resolve({ scannedFiles: 1, findings: [], allowances: [] }),
    readRegistryVersions: () => Promise.resolve([]),
    auditFirstPublish: () => Promise.resolve([]),
    runProvisioningDryCheck: () => Promise.resolve(),
    runCanonicalPreflight: () => Promise.resolve(),
    ...overrides,
  };
}

function publishSet(missing: PublishSetAuditResult['missing'] = []): PublishSetAuditResult {
  return {
    intended: [MEMBER, ...missing],
    effective: [MEMBER],
    excluded: [],
    missing,
    extra: [],
  };
}

function assertFailed(
  checks: readonly ReadinessCheckEvidence[],
  id: string,
  detail: string,
): void {
  const check = checks.find((entry) => entry.id === id);
  assertEquals(check?.status, 'FAIL');
  assert(check?.details.some((entry) => entry.includes(detail)));
}

async function versionFixture(): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-readiness-version-' });
  await Deno.mkdir(`${root}/packages/new`, { recursive: true });
  await Deno.writeTextFile(
    `${root}/deno.json`,
    JSON.stringify({ version: '0.0.2-canary.1', workspace: ['packages/*'] }),
  );
  await Deno.writeTextFile(`${root}/deno.lock`, '{}\n');
  await Deno.writeTextFile(
    `${root}/packages/new/deno.json`,
    JSON.stringify({ name: '@netscript/new', version: '0.0.2-canary.1' }),
  );
  return root;
}

async function firstPublishFixture(
  options: {
    readme?: boolean;
    tagline?: string;
    license?: boolean;
    exports?: boolean;
    docs?: boolean;
  } = {},
): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-readiness-first-' });
  await Deno.mkdir(`${root}/packages/new`, { recursive: true });
  const manifest: Record<string, unknown> = {
    name: '@netscript/new',
    version: '0.0.2-canary.1',
  };
  if (options.license !== false) manifest.license = 'Apache-2.0';
  if (options.exports !== false) manifest.exports = { '.': './mod.ts' };
  await Deno.writeTextFile(`${root}/packages/new/deno.json`, JSON.stringify(manifest));

  if (options.readme !== false) {
    await Deno.writeTextFile(
      `${root}/packages/new/README.md`,
      [
        '# @netscript/new',
        '',
        options.tagline ?? '**Production-ready NetScript package.**',
        '',
        '## Install',
        '',
        'deno add jsr:@netscript/new',
        '',
        '## Quick start',
        '',
        '```ts',
        "import '@netscript/new';",
        '```',
        '',
        '## Docs',
        '',
        '[Reference](https://example.test/new)',
        '',
      ].join('\n'),
    );
  }
  if (options.docs !== false) {
    await Deno.mkdir(`${root}/docs/site/reference/new`, { recursive: true });
    await Deno.writeTextFile(`${root}/docs/site/reference/new/index.md`, '# New\n');
  }
  return root;
}
