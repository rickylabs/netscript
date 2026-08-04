import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  classifyDenoConfigChange,
  classifyPath,
  decide,
  type Decision,
  isDocsOnlyPath,
  isImpacting,
  parseFiles,
  parseLabels,
  parseNameStatus,
  sanitizeReason,
} from './ci-classify-changes.ts';

function vector(d: Decision) {
  return {
    deno: d.needsDeno,
    docker: d.needsDocker,
    desktop: d.needsDesktop,
    docs: d.needsDocs,
    surface: d.needsSurface,
  };
}

const ALL_TRUE = { deno: true, docker: true, desktop: true, docs: true, surface: true };
const ALL_FALSE = { deno: false, docker: false, desktop: false, docs: false, surface: false };

function workflowJob(source: string, id: string): string | undefined {
  const lines = source.split('\n');
  const start = lines.indexOf(`  ${id}:`);
  if (start < 0) return undefined;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (/^ {2}[a-z][a-z0-9-]*:$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

// ── rename-hole regression (adversarial review, defect 1) ────────────────────

Deno.test('regression: packages/cli/a.ts -> docs/a.md rename is NOT docs-only', () => {
  // `git diff --name-status -M` reports `R087\tpackages/cli/a.ts\tdocs/a.md`.
  const files = parseNameStatus('R087\tpackages/cli/a.ts\tdocs/a.md');
  assertEquals(files, ['packages/cli/a.ts', 'docs/a.md']);
  const d = decide({ eventName: 'pull_request', files, labels: [] });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('parseNameStatus: statuses A/M/D keep their single path', () => {
  const files = parseNameStatus(
    'A\tdocs/new.md\nM\tpackages/cli/mod.ts\nD\tplugins/sagas/gone.ts',
  );
  assertEquals(files, [
    'docs/new.md',
    'packages/cli/mod.ts',
    'plugins/sagas/gone.ts',
  ]);
});

Deno.test('parseNameStatus: copies include both sides; deletes stay impacting', () => {
  const files = parseNameStatus('C90\tpackages/kv/mod.ts\tdocs/copy.md\nD\tpackages/sdk/x.ts');
  assertEquals(files, ['packages/kv/mod.ts', 'docs/copy.md', 'packages/sdk/x.ts']);
  const d = decide({ eventName: 'pull_request', files, labels: [] });
  assertEquals(d.docsOnly, false);
});

Deno.test('parseNameStatus: docs-to-docs rename stays docs-only', () => {
  const files = parseNameStatus('R100\tdocs/old.md\tdocs/new.md');
  const d = decide({ eventName: 'pull_request', files, labels: [] });
  assertEquals(d.docsOnly, true);
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
});

Deno.test('rename of a Markdown file under packages stays docs-only', () => {
  const files = parseNameStatus(
    'R100\tpackages/cli/OLD_README.md\tpackages/cli/README.md',
  );
  const d = decide({ eventName: 'pull_request', files, labels: [] });
  assertEquals(d.docsOnly, true);
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
  // Mirrors the old surface-diff `paths: packages/**` trigger.
  assertEquals(d.needsSurface, true);
});

Deno.test('parseNameStatus: unrecognisable line degrades to a bare path (forces run)', () => {
  const files = parseNameStatus('something-weird-without-tab');
  assertEquals(files, ['something-weird-without-tab']);
  const d = decide({ eventName: 'pull_request', files, labels: [] });
  assertEquals(d.docsOnly, false);
});

Deno.test('parseNameStatus: empty/undefined input', () => {
  assertEquals(parseNameStatus(''), []);
  assertEquals(parseNameStatus(undefined), []);
});

// ── reason sanitization (adversarial review, defect 3) ───────────────────────

Deno.test('sanitizeReason: strips control chars and newlines', () => {
  assertEquals(
    sanitizeReason('a\nb\r\nc\x00d'),
    'a b c d',
  );
});

Deno.test('sanitizeReason: caps length at 500', () => {
  const long = 'x'.repeat(600);
  const out = sanitizeReason(long);
  assertEquals(out.length, 500);
  assertEquals(out.endsWith('...'), true);
});

Deno.test('reason with a GITHUB_OUTPUT-injection filename stays one line', () => {
  const evil = 'packages/cli/$(touch pwned)\nrun_static=false.ts';
  const d = decide({
    eventName: 'pull_request',
    files: [evil],
    labels: ['ci:skip-e2e'],
  });
  const safe = sanitizeReason(d.reason);
  assertEquals(safe.includes('\n'), false);
  // The evil path is impacting (packages/) so the gate still runs static.
  assertEquals(d.runStatic, true);
});

// ── per-path classification ──────────────────────────────────────────────────

Deno.test('docs surfaces are docs-only', () => {
  for (
    const p of [
      'README.md',
      'docs/site/index.md',
      'docs/architecture/doctrine/x.md',
      '.llm/harness/workflow/run-loop.md',
      '.agents/skills/netscript-pr/SKILL.md',
      '.claude/skills/x/SKILL.md',
      'CONTRIBUTING.mdx',
      '.github/pull_request_template.md',
    ]
  ) {
    assertEquals(isDocsOnlyPath(p), true, `expected docs-only: ${p}`);
  }
});

Deno.test('Markdown is docs-only under ordinary impacting directories', () => {
  assertEquals(isDocsOnlyPath('packages/cli/README.md'), true);
  assertEquals(isDocsOnlyPath('plugins/workers/CHANGELOG.md'), true);
  assertEquals(isDocsOnlyPath('apps/demo/README.mdx'), true);
});

Deno.test('critical workflow paths win over the markdown allowlist', () => {
  assertEquals(isDocsOnlyPath('.github/workflows/README.md'), false);
});

Deno.test('impacting surfaces force the scaffold gate', () => {
  for (
    const p of [
      'packages/cli/e2e/cli.ts',
      'packages/service/mod.ts',
      'plugins/sagas/mod.ts',
      'apps/demo/main.ts',
      'deno.json',
      'deno.jsonc',
      'deno.lock',
      'examples/x/deno.json',
      '.github/workflows/e2e-cli.yml',
      '.github/workflows/ci.yml',
    ]
  ) {
    assertEquals(isImpacting(p), true, `expected impacting: ${p}`);
    assertEquals(isDocsOnlyPath(p), false, `expected not docs-only: ${p}`);
  }
});

Deno.test('unknown root paths force the gate (conservative default)', () => {
  assertEquals(isDocsOnlyPath('tsconfig.json'), false);
  assertEquals(isDocsOnlyPath('mod.ts'), false);
  assertEquals(isDocsOnlyPath('.gitignore'), false);
});

Deno.test('SAFETY: an unrecognised path forces EVERY output true', () => {
  for (const p of ['tools/foo.sh', 'scripts/x.py', '.github/labels.yml', 'Makefile']) {
    const caps = classifyPath(p);
    assertEquals(caps, {
      scaffold: true,
      docker: true,
      desktop: true,
      deno: true,
      docs: true,
      surface: true,
    }, `expected full escalation for: ${p}`);
    const d = decide({ eventName: 'pull_request', files: [p], labels: [] });
    assertEquals(d.runStatic, true, p);
    assertEquals(d.runRuntimeSqlite, true, p);
    assertEquals(d.runRuntime, true, p);
    assertEquals(vector(d), ALL_TRUE, p);
  }
});

Deno.test('SAFETY: the classifier own sources force everything (.github/scripts)', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['.github/scripts/ci-classify-changes.ts'],
    labels: [],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, true);
  assertEquals(d.runRuntime, true);
  assertEquals(vector(d), ALL_TRUE);
});

// ── tier-defining vs non-tier workflows (#1122 precision) ────────────────────

Deno.test('tier-defining workflow edits escalate scaffold, docker and desktop', () => {
  for (const wf of ['.github/workflows/e2e-cli.yml', '.github/workflows/ci.yml']) {
    const d = decide({ eventName: 'pull_request', files: [wf], labels: [] });
    assertEquals(d.runStatic, true, wf);
    assertEquals(d.runRuntime, true, wf);
    assertEquals(d.needsDocker, true, wf);
    assertEquals(d.needsDesktop, true, wf);
    assertEquals(d.needsDeno, true, wf);
  }
});

Deno.test('NEGATIVE: non-tier workflow edits set needs_deno ONLY', () => {
  for (
    const wf of [
      '.github/workflows/release-canary.yml',
      '.github/workflows/pages.yml',
      '.github/workflows/publish.yml',
      '.github/workflows/surface-diff.yml',
    ]
  ) {
    const d = decide({ eventName: 'pull_request', files: [wf], labels: [] });
    assertEquals(d.runStatic, false, wf);
    assertEquals(d.runRuntime, false, wf);
    assertEquals(vector(d), { ...ALL_FALSE, deno: true }, wf);
  }
});

// ── root deno.json discrimination (#1122 precision) ──────────────────────────

const DENO_BASE = JSON.stringify({
  version: '0.0.3',
  workspace: ['packages/*'],
  imports: { '@std/assert': 'jsr:@std/assert@^1.0.0' },
  tasks: { check: 'deno check .' },
});
const DENO_TASKS_ONLY = JSON.stringify({
  version: '0.0.3',
  workspace: ['packages/*'],
  imports: { '@std/assert': 'jsr:@std/assert@^1.0.0' },
  tasks: { 'check': 'deno check .', 'release:canary-label': 'deno run x.ts' },
});
const DENO_TOOLCHAIN = JSON.stringify({
  version: '0.0.3',
  workspace: ['packages/*', 'plugins/*'],
  imports: { '@std/assert': 'jsr:@std/assert@^1.0.0' },
  tasks: { check: 'deno check .' },
});

Deno.test('classifyDenoConfigChange: tasks-only vs toolchain vs unparseable', () => {
  assertEquals(classifyDenoConfigChange(DENO_BASE, DENO_TASKS_ONLY), 'tasks-only');
  assertEquals(classifyDenoConfigChange(DENO_BASE, DENO_BASE), 'tasks-only');
  assertEquals(classifyDenoConfigChange(DENO_BASE, DENO_TOOLCHAIN), 'toolchain');
  assertEquals(classifyDenoConfigChange(DENO_BASE, '{not json'), 'toolchain');
  assertEquals(classifyDenoConfigChange(undefined, DENO_BASE), 'toolchain');
  assertEquals(classifyDenoConfigChange(DENO_BASE, undefined), 'toolchain');
  assertEquals(classifyDenoConfigChange('', DENO_BASE), 'toolchain');
  assertEquals(classifyDenoConfigChange(DENO_BASE, '[1,2]'), 'toolchain');
});

Deno.test('#1122 REPLAY: release workflow + tasks-only deno.json + .llm tools stays off the scaffold tiers', () => {
  const d = decide({
    eventName: 'pull_request',
    files: [
      '.github/workflows/release-canary.yml',
      'deno.json',
      '.llm/tools/release/canary-label.ts',
      '.llm/tools/generate-publish-assets.ts',
      '.llm/runs/some-run/worklog.md',
    ],
    labels: [],
    rootDenoConfig: { base: DENO_BASE, head: DENO_TASKS_ONLY },
  });
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
  assertEquals(d.needsDocker, false);
  assertEquals(d.needsDesktop, false);
  // check-test still runs: root `deno test` discovers `.llm/tools` tests and
  // `.llm/tools/release/release-canary-workflow_test.ts` reads the workflow.
  assertEquals(d.needsDeno, true);
  assertEquals(d.docsOnly, false);
});

Deno.test('root deno.json toolchain change (workspace/imports) escalates everything', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['deno.json'],
    labels: [],
    rootDenoConfig: { base: DENO_BASE, head: DENO_TOOLCHAIN },
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
  assertEquals(d.needsDesktop, true);
  assertEquals(d.needsDeno, true);
});

Deno.test('NEGATIVE: root deno.json with NO base/head content escalates (fail toward running)', () => {
  const d = decide({ eventName: 'pull_request', files: ['deno.json'], labels: [] });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
  assertEquals(d.needsDesktop, true);
});

Deno.test('deno.lock always escalates (tasks-only discrimination never applies)', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['deno.lock'],
    labels: [],
    rootDenoConfig: { base: DENO_BASE, head: DENO_TASKS_ONLY },
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
  assertEquals(d.needsDesktop, true);
});

Deno.test('nested workspace deno.json escalates regardless of root discrimination', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['examples/x/deno.json'],
    labels: [],
    rootDenoConfig: { base: DENO_BASE, head: DENO_TASKS_ONLY },
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

// ── capability vector per source area ────────────────────────────────────────

Deno.test('packages (non-cli) code: deno+docker+scaffold+surface, NOT desktop', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/database/src/mod.ts'],
    labels: [],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
  assertEquals(vector(d), { deno: true, docker: true, desktop: false, docs: false, surface: true });
});

Deno.test('packages/cli code: the .deb surface -> needs_desktop', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/src/public/features/deploy/target/desktop/release/release-group.ts'],
    labels: [],
  });
  assertEquals(d.needsDesktop, true);
  assertEquals(d.needsDocker, true);
});

Deno.test('plugins code: docker yes, desktop/surface no', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['plugins/workers/mod.ts'],
    labels: [],
  });
  assertEquals(d.runRuntime, true);
  assertEquals(vector(d), {
    deno: true,
    docker: true,
    desktop: false,
    docs: false,
    surface: false,
  });
});

Deno.test('NEGATIVE: agent-context-only change (.agents one-file PR, #1055) skips everything', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['.agents/skills/netscript-pr/SKILL.md'],
    labels: [],
  });
  assertEquals(d.docsOnly, true);
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
  assertEquals(vector(d), ALL_FALSE);
});

Deno.test('docs/ markdown: needs_docs only', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/index.md'],
    labels: [],
  });
  assertEquals(d.docsOnly, true);
  assertEquals(vector(d), { ...ALL_FALSE, docs: true });
});

Deno.test('package README: docs + surface, no toolchain', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/README.md'],
    labels: [],
  });
  assertEquals(d.docsOnly, true);
  assertEquals(d.runStatic, false);
  assertEquals(vector(d), {
    deno: false,
    docker: false,
    desktop: false,
    docs: true,
    surface: true,
  });
});

Deno.test('.llm/tools code files set needs_deno (root deno test discovers them)', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['.llm/tools/release/canary-label.ts'],
    labels: [],
  });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
  assertEquals(vector(d), { ...ALL_FALSE, deno: true });
});

Deno.test('NEGATIVE: .llm non-code files stay fully skipped', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['.llm/runs/x/worklog.md', '.llm/harness/workflow/lane-policy.md'],
    labels: [],
  });
  assertEquals(d.docsOnly, true);
  assertEquals(vector(d), ALL_FALSE);
});

Deno.test('docs/ code files set docs AND deno', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/build.ts'],
    labels: [],
  });
  assertEquals(vector(d), { ...ALL_FALSE, deno: true, docs: true });
});

// ── decide: aggregate + labels ───────────────────────────────────────────────

Deno.test('decide: docs-only PR skips both jobs', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/a.md', 'README.md', '.llm/x.md'],
    labels: [],
  });
  assertEquals(d.docsOnly, true);
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntimeSqlite, false);
  assertEquals(d.runRuntime, false);
});

Deno.test('decide: Markdown-only diff under packages is docs-only', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/README.md', 'packages/sdk/guides/setup.mdx'],
    labels: [],
  });
  assertEquals(d.docsOnly, true);
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
});

Deno.test('decide: Markdown plus one TypeScript file is full', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/README.md', 'packages/cli/mod.ts'],
    labels: [],
  });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: Markdown plus deno.lock is full', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/README.md', 'deno.lock'],
    labels: [],
  });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: one code file forces both jobs', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/a.md', 'packages/cli/mod.ts'],
    labels: [],
  });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: empty diff runs EVERYTHING (cannot classify)', () => {
  const d = decide({ eventName: 'pull_request', files: [], labels: [] });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, true);
  assertEquals(d.runRuntime, true);
  assertEquals(vector(d), ALL_TRUE);
});

Deno.test('decide: ci:skip-e2e skips runtime only', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-e2e'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, false);
  assertEquals(d.runRuntime, false);
  assertEquals(
    d.reason.includes('scaffold-runtime-sqlite skipped by ci:skip-e2e'),
    true,
  );
});

Deno.test('decide: ci:skip-scaffold skips static only', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-scaffold'],
  });
  assertEquals(d.runStatic, false);
  // ci:skip-scaffold is not an independent sqlite-runtime override. The
  // derived tier is false here because its run_static prerequisite is false.
  assertEquals(d.runRuntimeSqlite, false);
  assertEquals(d.runRuntime, true);
  assertEquals(
    d.reason.includes('scaffold-runtime-sqlite skipped: scaffold-static signal is off'),
    true,
  );
});

Deno.test('decide: both skip labels skip both jobs', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-scaffold', 'ci:skip-e2e'],
  });
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntimeSqlite, false);
  assertEquals(d.runRuntime, false);
});

Deno.test('NEGATIVE: skip labels never widen to the vector (frozen semantics)', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-scaffold', 'ci:skip-e2e'],
  });
  // The scaffold tiers are label-skipped, but check-test/quality/desktop
  // still see the code change.
  assertEquals(d.needsDeno, true);
  assertEquals(d.needsDesktop, true);
  assertEquals(d.needsDocker, true);
});

Deno.test('decide: ci:full overrides docs-only and forces the ENTIRE vector', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/a.md'],
    labels: ['ci:full'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, true);
  assertEquals(d.runRuntime, true);
  assertEquals(vector(d), ALL_TRUE);
  assertEquals(
    d.reason.includes('scaffold-runtime-sqlite forced by ci:full'),
    true,
  );
});

Deno.test('decide: ci:full overrides skip labels', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:full', 'ci:skip-e2e', 'ci:skip-scaffold'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: workflow_dispatch runs everything (no diff)', () => {
  const d = decide({ eventName: 'workflow_dispatch', files: [], labels: [] });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, true);
  assertEquals(d.runRuntime, true);
  assertEquals(vector(d), ALL_TRUE);
});

Deno.test('decide: workflow_dispatch honours skip labels', () => {
  const d = decide({
    eventName: 'workflow_dispatch',
    files: [],
    labels: ['ci:skip-e2e'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntimeSqlite, false);
  assertEquals(d.runRuntime, false);
});

Deno.test('decide: workflow_dispatch honours ci:skip-scaffold for sqlite runtime', () => {
  const d = decide({
    eventName: 'workflow_dispatch',
    files: [],
    labels: ['ci:skip-scaffold'],
  });
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntimeSqlite, false);
  assertEquals(d.runRuntime, true);
  assertEquals(
    d.reason.includes('scaffold-runtime-sqlite skipped: scaffold-static signal is off'),
    true,
  );
});

Deno.test('decide: sqlite runtime reason follows the scaffold signal', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: [],
  });
  assertEquals(d.runRuntimeSqlite, true);
  assertEquals(
    d.reason.includes('scaffold-runtime-sqlite: scaffold-static signal is on'),
    true,
  );
});

Deno.test('workflow: sqlite runtime uses sibling diff guard and fails closed', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/e2e-cli.yml');
  const cliSurface = await Deno.readTextFile(
    'packages/cli/e2e/src/domain/cli-surface.ts',
  );
  const suiteId = /RUNTIME_SQLITE:\s*'([^']+)'/.exec(cliSurface)?.[1];
  assertEquals(typeof suiteId, 'string');
  const sqliteJob = workflowJob(workflow, 'scaffold-runtime-sqlite');
  assertEquals(typeof sqliteJob, 'string');
  assertEquals(
    sqliteJob!.includes(
      "if: ${{ !cancelled() && needs.classify.result != 'skipped' && needs.classify.outputs.diff_unavailable != 'true' }}",
    ),
    true,
  );
  assertEquals(
    sqliteJob!.includes(
      "RUN: ${{ needs.classify.result != 'success' || needs.classify.outputs.run_runtime_sqlite == 'true' }}",
    ),
    true,
  );

  const classifyJob = workflowJob(workflow, 'classify');
  assertEquals(typeof classifyJob, 'string');
  assertEquals(
    classifyJob!.includes(
      'run_runtime_sqlite: ${{ steps.decide.outputs.run_runtime_sqlite }}',
    ),
    true,
  );

  assertEquals(
    sqliteJob!.includes(
      `deno task e2e:cli run ${suiteId} --cleanup --format pretty`,
    ),
    true,
  );
  assertEquals(
    sqliteJob!.includes('group: e2e-scaffold-runtime-sqlite-global'),
    true,
  );
  assertEquals(
    sqliteJob!.includes('name: e2e-cli-scaffold-runtime-sqlite-report'),
    true,
  );
  assertEquals(
    sqliteJob!.includes('.llm/tmp/**/report*.ndjson'),
    true,
  );

  const postgresJob = workflowJob(workflow, 'scaffold-runtime');
  assertEquals(typeof postgresJob, 'string');
  assertEquals(
    postgresJob!.includes('group: e2e-scaffold-runtime-global'),
    true,
  );
  assertEquals(
    postgresJob!.includes('name: e2e-cli-scaffold-runtime-report'),
    true,
  );
  assertEquals(
    sqliteJob!.includes('group: e2e-scaffold-runtime-global\n'),
    false,
  );
  assertEquals(
    sqliteJob!.includes('name: e2e-cli-scaffold-runtime-report\n'),
    false,
  );

  const visibilityJob = workflowJob(workflow, 'lane-visibility');
  assertEquals(typeof visibilityJob, 'string');
  assertEquals(
    visibilityJob!.includes(
      'needs: [classify, scaffold-static, scaffold-runtime, scaffold-runtime-sqlite, desktop-native-linux]',
    ),
    true,
  );
  assertEquals(
    visibilityJob!.includes(
      'printf \'| `scaffold-runtime-sqlite` | %s |\\n\' "$runtime_sqlite_outcome"',
    ),
    true,
  );
});

Deno.test('parseLabels: JSON array and comma forms', () => {
  assertEquals(parseLabels('["a","b"]'), ['a', 'b']);
  assertEquals(parseLabels('a, b ,c'), ['a', 'b', 'c']);
  assertEquals(parseLabels(''), []);
  assertEquals(parseLabels(undefined), []);
});

Deno.test('parseFiles: newline and comma forms', () => {
  assertEquals(parseFiles('a.md\nb.ts'), ['a.md', 'b.ts']);
  assertEquals(parseFiles('a.md,b.ts\n'), ['a.md', 'b.ts']);
  assertEquals(parseFiles(''), []);
});
