import { assertEquals } from 'jsr:@std/assert@1';

import { evaluateAspireVersionParity, parseManifest } from './check-aspire-version-parity.ts';

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

Deno.test('manifest parser skips the TSV header and preserves owner/disposition fields', () => {
  assertEquals(parseManifest(manifest)[0], {
    path: 'scaffold.ts',
    class: 'scaffold-constants',
    owner: 'S1',
    disposition: 'enforce',
  });
  assertEquals(parseManifest(manifest).length, 9);
});

Deno.test('phase 1 fails only scaffold constants, ci classes, and root config', async () => {
  const report = await evaluateAspireVersionParity({
    rows: parseManifest(manifest),
    phase: 1,
    expectedVersion: '13.5.3',
    readText,
  });

  assertEquals(report.ok, false);
  assertEquals(report.counts, {
    checked: 8,
    fail: 3,
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
    fail: 4,
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
