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
compat.ts\tcompat-fixture\tS3\tkeep 17.0.0 only
history.md\tarchival:this-run\tarchival\tinfo only
deno.lock\tlockfile\tN/A\tskip
current.ts\tpackage:other\tS4\tcurrent
missing.ts\tpackage:other\tS4\tmissing
`;

const files = new Map<string, string>([
  ['scaffold.ts', "export const version = '13.5.3';"],
  ['workflow.yml', 'comment: Aspire 13.5'],
  ['deno.json', '{"aspire":"13.4.6"}'],
  ['generator.ts', "const legacy = '13.5.3';"],
  ['compat.ts', "const versions = ['17.0.0'];"],
  ['history.md', 'Aspire 13.5 historical evidence'],
  ['deno.lock', 'Aspire.Hosting@13.5.3'],
  ['current.ts', "const version = '17.0.0';"],
]);

const readText = (path: string): Promise<string | null> => Promise.resolve(files.get(path) ?? null);

Deno.test('both Aspire parity phases skip all run and transient rows without reading them', async () => {
  const skipped = [
    '.llm/runs/epic-aspire-17-upgrade--2278/plan.md',
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
      expectedVersion: '17.0.0',
      readText: (path) => {
        reads.push(path);
        return Promise.resolve('13.5.3');
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
      name: 'literal guard location with trailing comma (13.4.6)',
      className: 'negative-version-guard',
      source: "forbidText(\n page,\n '13.4.6',\n 'docs/page.md',\n);",
      ok: true,
    },
    {
      name: 'literal guard location with trailing comma (13.5.3)',
      className: 'negative-version-guard',
      source: "forbidText(\n page,\n '13.5.3',\n 'docs/page.md',\n);",
      ok: true,
    },
    {
      name: 'stale third guard argument',
      className: 'negative-version-guard',
      source: "forbidText(page, '13.5.3', '13.5.3');",
      ok: false,
    },
    {
      name: 'quoted guard is not an executable guard',
      className: 'negative-version-guard',
      source: 'const example = "forbidText(page, \'13.5.3\', path);";',
      ok: false,
    },
    {
      name: 'unowned Aspire 13.5 mention',
      className: 'doc:public-page',
      source: 'Aspire 13.5 uses rooted config.',
      ok: false,
    },
    {
      name: 'wrong Aspire 17 patch in contextual line',
      className: 'doc:public-page',
      source: 'Aspire SDK version is 17.0.1.',
      ok: false,
    },
    {
      name: 'wrong Aspire 17 preview in contextual line',
      className: 'doc:public-page',
      source: 'Aspire.Hosting.Browsers 17.0.0-preview.1.26425.3',
      ok: false,
    },
    {
      name: 'allowed Aspire 17 pins pass',
      className: 'doc:public-page',
      source: 'Aspire SDK 17.0.0 and Aspire.Hosting.Browsers 17.0.0-preview.1.26567.5',
      ok: true,
    },
    {
      name: 'unrelated dependency versions pass',
      className: 'doc:public-page',
      source: 'DOTNET_SDK: 10.0.0, APPHOST_PG: 8.23.1, GARNET_TOOL: 2.2.14, dotenv: 17.4.2',
      ok: true,
    },
    {
      name: 'negative guard literal',
      className: 'negative-version-guard',
      source: "forbidText(page, '13.5.3', sourcePath);",
      ok: true,
    },
    {
      name: 'double-quoted multiline negative guard',
      className: 'negative-version-guard',
      source: 'forbidText(\n page,\n "13.5.3",\n sourcePath);',
      ok: true,
    },
    {
      name: 'positive guard',
      className: 'negative-version-guard',
      source: "requireText(page, '13.5.3', sourcePath);",
      ok: false,
    },
    {
      name: 'wrong guard argument',
      className: 'negative-version-guard',
      source: "forbidText('13.5.3', 'other', sourcePath);",
      ok: false,
    },
    {
      name: 'stale pin beside a negative guard',
      className: 'negative-version-guard',
      source: "forbidText(page, '13.5.3', sourcePath); const version = '13.5.3';",
      ok: false,
    },
    {
      name: 'unowned negative guard',
      className: 'tooling-doc',
      source: "forbidText(page, '13.5.3', sourcePath);",
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
      expectedVersion: '17.0.0',
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
    expectedVersion: '17.0.0',
    readText,
  });

  assertEquals(report.ok, false);
  assertEquals(report.counts, {
    checked: 8,
    fail: 4,
    deferred: 1,
    info: 1,
    skipped: 1,
    missing: 1,
  });
  assertEquals(report.findings.map(({ path, status, owner }) => ({ path, status, owner })), [
    { path: 'scaffold.ts', status: 'fail', owner: 'S1' },
    { path: 'workflow.yml', status: 'fail', owner: 'S1' },
    { path: 'deno.json', status: 'fail', owner: 'S1/S13' },
    { path: 'generator.ts', status: 'deferred', owner: 'S4' },
    { path: 'history.md', status: 'info', owner: 'archival' },
    { path: 'missing.ts', status: 'fail', owner: 'S4' },
  ]);
});

Deno.test('phase 2 fails every stale non-archival row and accepts a clean 17.0.0 compat fixture', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest(manifest),
    phase: 2,
    expectedVersion: '17.0.0',
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
      matches: [],
      reason: 'compat fixture contains the required 17.0.0 literal',
    },
  );
});

Deno.test('phase 2 fails a mixed 13.5.3 + 17.0.0 compat fixture', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest('path\tclass\towner\tdisposition\ncompat.ts\tcompat-fixture\tS3\tkeep\n'),
    phase: 2,
    expectedVersion: '17.0.0',
    readText: () => Promise.resolve("const versions = ['13.5.3', '17.0.0'];"),
  });

  assertEquals(report.ok, false);
  assertEquals(report.findings[0].status, 'fail');
  assertEquals(report.findings[0].matches, ['13.5.3']);
  assertEquals(
    report.findings[0].reason,
    'compat fixture contains stale or unauthorized Aspire literal alongside 17.0.0',
  );
});

Deno.test('phase 2 fails a compat fixture that lacks the 17.0.0 literal', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest('path\tclass\towner\tdisposition\ncompat.ts\tcompat-fixture\tS3\tkeep\n'),
    phase: 2,
    expectedVersion: '17.0.0',
    readText: () => Promise.resolve("const legacy = '13.5.3';"),
  });

  assertEquals(report.ok, false);
  assertEquals(report.findings[0].status, 'fail');
  assertEquals(report.findings[0].reason, 'compat fixture is missing the required 17.0.0 literal');
});

Deno.test('phase 2 rejects a longer compat peer token that only contains the required pin', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest('path\tclass\towner\tdisposition\ncompat.ts\tcompat-fixture\tS3\tkeep\n'),
    phase: 2,
    expectedVersion: '17.0.0',
    readText: () => Promise.resolve("const versions = ['17.0.00'];"),
  });

  assertEquals(report.ok, false);
  assertEquals(report.findings[0].status, 'fail');
  assertEquals(report.findings[0].reason, 'compat fixture is missing the required 17.0.0 literal');
});

Deno.test('phase 2 allows synthetic stale literals in validation-test-fixture when 17.0.0 is also covered', async () => {
  const passing = await evaluateAspireVersionParity({
    rows: parseManifest(
      'path\tclass\towner\tdisposition\ntest.ts\tvalidation-test-fixture\tS1\ttest\n',
    ),
    phase: 2,
    expectedVersion: '17.0.0',
    readText: () => Promise.resolve("const fixture = ['13.5.3', '17.0.0', '17.0.1'];"),
  });
  assertEquals(passing.ok, true);
  assertEquals(passing.findings[0]?.status, 'info');

  const failing = await evaluateAspireVersionParity({
    rows: parseManifest(
      'path\tclass\towner\tdisposition\ntest.ts\tvalidation-test-fixture\tS1\ttest\n',
    ),
    phase: 2,
    expectedVersion: '17.0.0',
    readText: () => Promise.resolve("const fixture = ['13.5.3'];"),
  });
  assertEquals(failing.ok, false);
  assertEquals(failing.findings[0]?.status, 'fail');
});

Deno.test('exact Aspire version comparison never accepts longer or suffixed tokens', () => {
  assertEquals(EXACT_ASPIRE_VERSION_TOKEN_MATCH('17.0.0', '17.0.0'), true);
  assertEquals(EXACT_ASPIRE_VERSION_TOKEN_MATCH(' 17.0.0 ', '17.0.0'), true);
  assertEquals(EXACT_ASPIRE_VERSION_TOKEN_MATCH('17.0.00', '17.0.0'), false);
  assertEquals(
    EXACT_ASPIRE_VERSION_TOKEN_MATCH('17.0.0-preview.1.26567.5', '17.0.0'),
    false,
  );
});

Deno.test('archival classes remain informational even when their owner field is not archival', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest(
      'path\tclass\towner\tdisposition\nhistory.md\tarchival:rfc\tlegacy-owner\tkeep\n',
    ),
    phase: 2,
    expectedVersion: '17.0.0',
    readText: () => Promise.resolve('Aspire 13.5 historical evidence'),
  });

  assertEquals(report.ok, true);
  assertEquals(report.findings[0]?.status, 'info');
});

Deno.test('stale or unmatched manifest generation fails closed before row evaluation', async () => {
  const stale = await evaluateAspireVersionParity({
    rows: [],
    phase: 2,
    expectedVersion: '17.0.0',
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
    expectedVersion: '17.0.0',
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
    expectedVersion: '17.0.0',
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

Deno.test('phase 1 and phase 2 fail unauthorized 17.x patches, missing required pins, and allow unrelated pins', async () => {
  const exactPinRows = [
    [
      'packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts',
      'scaffold-constants',
      "ASPIRE_SDK: '17.0.0', DOTNET_SDK: '10.0.0', APPHOST_PG: '8.23.1', GARNET_TOOL: '2.2.14'",
      "ASPIRE_SDK: '17.0.1'",
      "DOTNET_SDK: '10.0.0'",
    ],
    [
      'packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts',
      'scaffold-constants',
      "VERSION: '17.0.0', BROWSERS: '17.0.0-preview.1.26567.5'",
      "VERSION: '17.0.0', BROWSERS: '17.0.0-preview.1.26425.3'",
      "VERSION: '17.0.0'",
    ],
    [
      '.github/toolchain.env',
      'ci:other',
      'NETSCRIPT_DENO_VERSION=v2.9.8\nNETSCRIPT_ASPIRE_CLI_VERSION=17.0.0\nNETSCRIPT_ASPIRE_SDK_VERSION=17.0.0',
      'NETSCRIPT_ASPIRE_CLI_VERSION=17.0.2',
      'NETSCRIPT_DENO_VERSION=v2.9.8',
    ],
    [
      '.github/scripts/aspire-nuget-cache-policy.test.ts',
      'ci:policy-test',
      "const ASPIRE_VERSION = '17.0.0'; const key = 'nuget-aspire-17.0.0-v1';",
      "const ASPIRE_VERSION = '17.0.2'; const key = 'nuget-aspire-17.0.0-v1';",
      "const ASPIRE_VERSION = '17.0.0';",
    ],
    [
      '.github/workflows/e2e-cli.yml',
      'ci:workflow',
      'key: nuget-aspire-${{ runner.os }}-17.0.0-v1\n--version 17.0.0',
      'key: nuget-aspire-${{ runner.os }}-17.0.1-v1\n--version 17.0.0',
      'key: nuget-aspire-${{ runner.os }}-17.0.0-v1',
    ],
    [
      '.github/workflows/e2e-cli-prod.yml',
      'ci:workflow',
      'key: nuget-aspire-${{ runner.os }}-17.0.0-v1\n--version 17.0.0',
      'key: nuget-aspire-${{ runner.os }}-17.0.0-v1\n--version 17.0.1',
      '--version 17.0.0',
    ],
    [
      '.github/workflows/e2e-cli-prod-local.yml',
      'ci:workflow',
      'key: nuget-aspire-${{ runner.os }}-17.0.0-v1\n--version 17.0.0',
      'key: nuget-aspire-${{ runner.os }}-17.0.0-v2\n--version 17.0.0',
      '--version 17.0.0',
    ],
  ] as const;

  for (const phase of [1, 2] as const) {
    for (const [path, className, validSource, badPatchSource, missingPinSource] of exactPinRows) {
      const valid = await evaluateAspireVersionParity({
        rows: [{ path, class: className, owner: 'S1', disposition: 'enforce' }],
        phase,
        expectedVersion: '17.0.0',
        readText: () => Promise.resolve(validSource),
      });
      assertEquals(valid.ok, true, `${path} phase=${phase} valid`);

      const badPatch = await evaluateAspireVersionParity({
        rows: [{ path, class: className, owner: 'S1', disposition: 'enforce' }],
        phase,
        expectedVersion: '17.0.0',
        readText: () => Promise.resolve(badPatchSource),
      });
      assertEquals(badPatch.ok, false, `${path} phase=${phase} badPatch`);

      const missingPin = await evaluateAspireVersionParity({
        rows: [{ path, class: className, owner: 'S1', disposition: 'enforce' }],
        phase,
        expectedVersion: '17.0.0',
        readText: () => Promise.resolve(missingPinSource),
      });
      assertEquals(missingPin.ok, false, `${path} phase=${phase} missingPin`);
      assertEquals(
        missingPin.findings.some((f) =>
          f.reason === 'required Aspire pin is missing from locked exact-pin surface'
        ),
        true,
        `${path} phase=${phase} missingPin reason`,
      );
    }
  }
});
