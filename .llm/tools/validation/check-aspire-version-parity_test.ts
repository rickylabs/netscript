import { assertEquals } from 'jsr:@std/assert@1';

import {
  evaluateAspireVersionParity,
  EXACT_ASPIRE_VERSION_TOKEN_MATCH,
  parseManifest,
  parsePhase,
} from './check-aspire-version-parity.ts';

const manifest = `path\tclass\towner\tdisposition
scaffold.ts\tscaffold-constants\tS1\tenforce
workflow.yml\tci:workflow\tS1\tenforce
deno.json\troot-config\tS1/S13\tenforce
generator.ts\tgenerator\tS4\tdefer
compat.ts\tcompat-fixture\tS3\tkeep both trains
history.md\tarchival:this-run\tarchival\tinfo only
deno.lock\tlockfile\tN/A\tskip
current.ts\tpackage:other\tS4\tcurrent
missing.ts\tpackage:other\tS4\tmissing
`;

const files = new Map<string, string>([
  ['scaffold.ts', "export const version = '13.4.6';"],
  ['workflow.yml', 'comment: Aspire 13.4'],
  ['deno.json', '{"aspire":"13.3.9"}'],
  ['generator.ts', "const legacy = '13.2.1';"],
  ['compat.ts', "const versions = ['13.4.6', '13.5.3'];"],
  ['history.md', 'Aspire 13.1 historical evidence'],
  ['deno.lock', 'Aspire.Hosting@13.0.0'],
  ['current.ts', "const version = '13.5.3';"],
]);

const readText = (path: string): Promise<string | null> => Promise.resolve(files.get(path) ?? null);

Deno.test('both Aspire parity phases skip all run and transient rows without reading them', async () => {
  const skipped = [
    '.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md',
    '.llm/runs/future/receipt.json',
    '.llm/tmp/apphost.ts',
    '.agents/generated/consumer-skills/AGENTS.md',
    'packages/cli/node_modules/aspire.ts',
  ];
  for (const phase of [1, 2] as const) {
    const reads: string[] = [];
    const report = await evaluateAspireVersionParity({
      rows: [...skipped, 'packages/cli/src/current-pin.ts', 'docs/site/reference/aspire.md'].map((
        path,
      ) => ({
        path,
        class: 'scaffold-constants',
        owner: 'S13',
        disposition: 'enforce',
      })),
      phase,
      expectedVersion: '13.5.3',
      readText: (path) => {
        reads.push(path);
        return Promise.resolve('13.4.6');
      },
    });
    assertEquals(report.skipped, skipped);
    assertEquals(reads, ['packages/cli/src/current-pin.ts', 'docs/site/reference/aspire.md']);
    assertEquals(report.counts.checked, 2);
    assertEquals(report.counts.fail, 2);
  }
});

for (
  const { name, className, source, ok } of [
    {
      name: 'literal guard location with trailing comma',
      className: 'negative-version-guard',
      source: "forbidText(\n page,\n '13.4.6',\n 'docs/page.md',\n);",
      ok: true,
    },
    {
      name: 'stale third guard argument',
      className: 'negative-version-guard',
      source: "forbidText(page, '13.4.6', '13.4.6');",
      ok: false,
    },
    {
      name: 'quoted guard is not an executable guard',
      className: 'negative-version-guard',
      source: 'const example = "forbidText(page, \'13.4.6\', path);";',
      ok: false,
    },
    {
      name: 'unowned floor',
      className: 'doc:public-page',
      source: 'Aspire 13.2+ uses rooted config.',
      ok: false,
    },
    {
      name: 'current pin beside a floor',
      className: 'doc:public-page',
      source: 'Aspire 13.2+ uses rooted config. Install 13.4.6.',
      ok: false,
    },
    {
      name: 'non-floor guidance',
      className: 'doc:public-page',
      source: 'Install Aspire 13.2.',
      ok: false,
    },
    {
      name: 'negative guard literal',
      className: 'negative-version-guard',
      source: "forbidText(page, '13.4.6', sourcePath);",
      ok: true,
    },
    {
      name: 'double-quoted multiline negative guard',
      className: 'negative-version-guard',
      source: 'forbidText(\n page,\n "13.4.6",\n sourcePath);',
      ok: true,
    },
    {
      name: 'positive guard',
      className: 'negative-version-guard',
      source: "requireText(page, '13.4.6', sourcePath);",
      ok: false,
    },
    {
      name: 'wrong guard argument',
      className: 'negative-version-guard',
      source: "forbidText('13.4.6', 'other', sourcePath);",
      ok: false,
    },
    {
      name: 'stale pin beside a negative guard',
      className: 'negative-version-guard',
      source: "forbidText(page, '13.4.6', sourcePath); const version = '13.4.6';",
      ok: false,
    },
    {
      name: 'unowned negative guard',
      className: 'tooling-doc',
      source: "forbidText(page, '13.4.6', sourcePath);",
      ok: false,
    },
  ]
) {
  Deno.test(`phase 2 context policy: ${name}`, async () => {
    const report = await evaluateAspireVersionParity({
      rows: [{
        path: 'owned-surface',
        class: className,
        owner: 'S13',
        disposition: 'enforce remaining pins',
      }],
      phase: 2,
      expectedVersion: '13.5.3',
      readText: () => Promise.resolve(source),
    });
    assertEquals(report.ok, ok);
    assertEquals(report.counts.fail, ok ? 0 : 1);
  });
}

Deno.test('manifest parser skips the TSV header and preserves owner/disposition fields', () => {
  assertEquals(parseManifest(manifest)[0], {
    path: 'scaffold.ts',
    class: 'scaffold-constants',
    owner: 'S1',
    disposition: 'enforce',
  });
  assertEquals(parseManifest(manifest).length, 9);
});

Deno.test('phase 1 remains the default while phase 2 requires an explicit selector', () => {
  assertEquals(parsePhase([]), 1);
  assertEquals(parsePhase(['--report']), 1);
  assertEquals(parsePhase(['--phase', '2']), 2);
});

Deno.test('phase 1 limits stale failures to owned classes and fails required missing paths', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest(manifest),
    phase: 1,
    expectedVersion: '13.5.3',
    readText,
  });

  assertEquals(report.ok, false);
  assertEquals(report.counts, {
    checked: 8,
    fail: 4,
    deferred: 2,
    info: 1,
    skipped: 1,
    missing: 1,
  });
  assertEquals(report.findings.map(({ path, status, owner }) => ({ path, status, owner })), [
    { path: 'scaffold.ts', status: 'fail', owner: 'S1' },
    { path: 'workflow.yml', status: 'fail', owner: 'S1' },
    { path: 'deno.json', status: 'fail', owner: 'S1/S13' },
    { path: 'generator.ts', status: 'deferred', owner: 'S4' },
    { path: 'compat.ts', status: 'deferred', owner: 'S3' },
    { path: 'history.md', status: 'info', owner: 'archival' },
    { path: 'missing.ts', status: 'fail', owner: 'S4' },
  ]);
});

Deno.test('phase 2 fails every stale non-archival row and accepts a dual-train compat fixture', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest(manifest),
    phase: 2,
    expectedVersion: '13.5.3',
    readText,
  });

  assertEquals(report.ok, false);
  assertEquals(report.counts, {
    checked: 8,
    fail: 5,
    deferred: 0,
    info: 2,
    skipped: 1,
    missing: 1,
  });
  assertEquals(
    report.findings.find((finding) => finding.path === 'compat.ts'),
    {
      path: 'compat.ts',
      class: 'compat-fixture',
      owner: 'S3',
      status: 'info',
      matches: ['13.4.6'],
      reason: 'compat fixture contains the required 13.5.3 literal',
    },
  );
});

Deno.test('phase 2 fails a compat fixture that lacks the current train literal', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest('path\tclass\towner\tdisposition\ncompat.ts\tcompat-fixture\tS3\tkeep\n'),
    phase: 2,
    expectedVersion: '13.5.3',
    readText: () => Promise.resolve("const legacy = '13.4.6';"),
  });

  assertEquals(report.ok, false);
  assertEquals(report.findings[0].status, 'fail');
  assertEquals(report.findings[0].reason, 'compat fixture is missing the required 13.5.3 literal');
});

Deno.test('phase 2 requires the 13.5.3 compat case independently of the current scaffold pin', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest('path\tclass\towner\tdisposition\ncompat.ts\tcompat-fixture\tS3\tkeep\n'),
    phase: 2,
    expectedVersion: '13.4.6',
    readText: () => Promise.resolve("const versions = ['13.4.6', '13.5.3'];"),
  });

  assertEquals(report.ok, true);
  assertEquals(report.findings[0]?.status, 'info');
  assertEquals(report.findings[0]?.reason, 'compat fixture contains the required 13.5.3 literal');
});

Deno.test('phase 2 rejects a longer compat peer token that only contains the required pin', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest('path\tclass\towner\tdisposition\ncompat.ts\tcompat-fixture\tS3\tkeep\n'),
    phase: 2,
    expectedVersion: '13.5.3',
    readText: () => Promise.resolve("const versions = ['13.4.6', '13.5.30'];"),
  });

  assertEquals(report.ok, false);
  assertEquals(report.findings[0].status, 'fail');
  assertEquals(report.findings[0].reason, 'compat fixture is missing the required 13.5.3 literal');
});

Deno.test('phase 2 accepts an exact compat peer token', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest('path\tclass\towner\tdisposition\ncompat.ts\tcompat-fixture\tS3\tkeep\n'),
    phase: 2,
    expectedVersion: '13.5.3',
    readText: () => Promise.resolve("const versions = ['13.4.6', '13.5.3'];"),
  });

  assertEquals(report.ok, true);
  assertEquals(report.findings[0].status, 'info');
  assertEquals(report.findings[0].reason, 'compat fixture contains the required 13.5.3 literal');
});

Deno.test('exact Aspire version comparison never accepts longer or suffixed tokens', () => {
  assertEquals(EXACT_ASPIRE_VERSION_TOKEN_MATCH('13.5.3', '13.5.3'), true);
  assertEquals(EXACT_ASPIRE_VERSION_TOKEN_MATCH(' 13.5.3 ', '13.5.3'), true);
  assertEquals(EXACT_ASPIRE_VERSION_TOKEN_MATCH('13.5.30', '13.5.3'), false);
  assertEquals(
    EXACT_ASPIRE_VERSION_TOKEN_MATCH('13.5.3-preview.1.26425.3', '13.5.3'),
    false,
  );
});

Deno.test('archival classes remain informational even when their owner field is not archival', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest(
      'path\tclass\towner\tdisposition\nhistory.md\tarchival:rfc\tlegacy-owner\tkeep\n',
    ),
    phase: 2,
    expectedVersion: '13.5.3',
    readText: () => Promise.resolve('Aspire 13.2 historical evidence'),
  });

  assertEquals(report.ok, true);
  assertEquals(report.findings[0]?.status, 'info');
});

Deno.test('stale or unmatched manifest generation fails closed before row evaluation', async () => {
  const stale = await evaluateAspireVersionParity({
    rows: [],
    phase: 2,
    expectedVersion: '13.5.3',
    readText,
    manifestSource: 'committed',
    generatedManifestSource: 'generated',
  });
  assertEquals(stale.ok, false);
  assertEquals(stale.manifestFresh, false);
  assertEquals(stale.findings[0]?.class, 'manifest:freshness');

  const unmatched = await evaluateAspireVersionParity({
    rows: [],
    phase: 2,
    expectedVersion: '13.5.3',
    readText,
    manifestSource: 'same',
    generatedManifestSource: 'same',
    generatedManifestUnmatched: ['new-aspire-surface.ts'],
  });
  assertEquals(unmatched.ok, false);
  assertEquals(unmatched.findings[0]?.matches, ['new-aspire-surface.ts']);
});

Deno.test('missing archival paths remain non-failing but missing required paths fail closed', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest(
      'path\tclass\towner\tdisposition\nrequired.ts\tci:workflow\tS1\tenforce\nhistory.md\tarchival:this-run\tarchival\tinfo\n',
    ),
    phase: 1,
    expectedVersion: '13.5.3',
    readText: () => Promise.resolve(null),
  });

  assertEquals(report.ok, false);
  assertEquals(report.counts, {
    checked: 2,
    fail: 1,
    deferred: 0,
    info: 0,
    skipped: 0,
    missing: 2,
  });
  assertEquals(report.findings[0], {
    path: 'required.ts',
    class: 'ci:workflow',
    owner: 'S1',
    status: 'fail',
    matches: [],
    reason: 'required manifest path is missing',
  });
});

Deno.test('phase 1 fails every unauthorized 13.5.x patch across the exact-pin surface', async () => {
  const exactPinRows = [
    ['packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts', 'scaffold-constants'],
    ['packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts', 'scaffold-constants'],
    ['.github/toolchain.env', 'ci:other'],
    ['.github/scripts/aspire-nuget-cache-policy.test.ts', 'ci:policy-test'],
    ['.github/workflows/e2e-cli.yml', 'ci:workflow'],
    ['.github/workflows/e2e-cli-prod.yml', 'ci:workflow'],
    ['.github/workflows/e2e-cli-prod-local.yml', 'ci:workflow'],
  ] as const;

  for (const [path, className] of exactPinRows) {
    const report = await evaluateAspireVersionParity({
      rows: [{ path, class: className, owner: 'S1', disposition: 'enforce' }],
      phase: 1,
      expectedVersion: '13.5.3',
      readText: () => Promise.resolve("const unauthorized = '13.5.2';"),
    });
    assertEquals(report.ok, false, path);
    assertEquals(report.findings[0]?.status, 'fail', path);
    assertEquals(report.findings[0]?.matches, ['13.5.2'], path);
  }
});
