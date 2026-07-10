import {
  buildDoctorReport,
  buildRollbackPlan,
  classifyAntigravityAuth,
  classifyAuth,
  classifyComponent,
  classifyLegacyGeminiOwnership,
  classifyMobileControl,
  classifyStateDirectory,
  FOUNDATION_SCHEMA_VERSION,
  parseVersion,
  planBootstrap,
} from './wsl-foundation-lib.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

function assertEquals<T>(actual: T, expected: T): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

Deno.test('parseVersion accepts common tool banners', () => {
  assertEquals(parseVersion('v26.5.0\n'), '26.5.0');
  assertEquals(parseVersion('git version 2.43.0'), '2.43.0');
  assertEquals(parseVersion('{"appServerVersion":"0.144.1"}'), '0.144.1');
  assertEquals(parseVersion('no version'), null);
});

Deno.test('component classifier distinguishes missing, outdated, and ready', () => {
  assertEquals(
    classifyComponent({ component: 'node', output: '', exitCode: 127, expected: '26.5.0' }).status,
    'missing',
  );
  assertEquals(
    classifyComponent({ component: 'node', output: 'v18.19.1', exitCode: 0, expected: '26.5.0' })
      .status,
    'outdated',
  );
  assertEquals(
    classifyComponent({ component: 'node', output: 'v26.5.0', exitCode: 0, expected: '26.5.0' })
      .status,
    'ready',
  );
});

Deno.test('component classifier rejects successful unparseable version output', () => {
  const probe = classifyComponent({
    component: 'node',
    output: `not-a-version\n${'x'.repeat(200)}`,
    exitCode: 0,
    expected: '26.5.0',
  });
  assertEquals(probe.status, 'unavailable');
  assertEquals(probe.detectedVersion, null);
  assert(!probe.detail.includes('\n'), 'diagnostic must be single-line');
  assert(probe.detail.length <= 108, 'diagnostic must be bounded');
  assert(
    probe.detail.startsWith('unparseable version output: not-a-version '),
    'diagnostic is actionable',
  );
});

Deno.test('state directory detail never contains an absolute home path', () => {
  const probe = classifyStateDirectory('state-claude', '.claude', true);
  assert(!probe.detail.includes('/home/'), 'detail must be home-path independent');
  assertEquals(probe.status, 'ready');
});

Deno.test('Antigravity auth uses only secret-safe official session markers', () => {
  assertEquals(classifyAntigravityAuth(false, false).status, 'auth_required');
  assertEquals(classifyAntigravityAuth(true, true).status, 'ready');
});

Deno.test('legacy Gemini cleanup requires a matching ownership manifest', () => {
  assertEquals(classifyLegacyGeminiOwnership(false, false, false).status, 'ready');
  assertEquals(classifyLegacyGeminiOwnership(true, true, true).status, 'outdated');
  assertEquals(classifyLegacyGeminiOwnership(true, true, false).status, 'auth_conflict');
});

Deno.test('missing provider sessions are non-fatal auth-required states', () => {
  const probes = classifyAuth(new Set(), false, false);
  assert(
    probes.every((probe) => probe.status === 'auth_required'),
    'both providers require browser auth',
  );
});

Deno.test('Codex version skew remains distinct from managed availability', () => {
  assertEquals(classifyMobileControl(true, '0.144.1', '0.142.5').status, 'version_skew');
  assertEquals(classifyMobileControl(false, '0.144.1', null).status, 'unavailable');
});

Deno.test('doctor report prioritizes auth conflict over degraded state', () => {
  const report = buildDoctorReport({
    generatedAt: '2026-07-10T00:00:00.000Z',
    nativePath: { cwd: '/home/codex/repos/netscript', nativeExt4: true },
    components: [
      classifyComponent({ component: 'node', output: 'v26.5.0', exitCode: 0, expected: '26.5.0' }),
    ],
    auth: classifyAuth(new Set(['ANTHROPIC_API_KEY']), true, false),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  assertEquals(report.schemaVersion, FOUNDATION_SCHEMA_VERSION);
  assertEquals(report.overall, 'invalid_configuration');
});

Deno.test('bootstrap plan is ordered, exact-versioned, and reversible by ownership', () => {
  const report = buildDoctorReport({
    generatedAt: '2026-07-10T00:00:00.000Z',
    nativePath: { cwd: '/home/codex/repos/netscript', nativeExt4: true },
    components: [
      classifyComponent({ component: 'node', output: 'v18.19.1', exitCode: 0, expected: '26.5.0' }),
      classifyComponent({ component: 'claude', output: '', exitCode: 127 }),
      classifyComponent({ component: 'antigravity', output: '', exitCode: 127 }),
      classifyStateDirectory('state-claude', '.claude', false),
      classifyAntigravityAuth(false, false),
      classifyLegacyGeminiOwnership(true, true, true),
    ],
    auth: classifyAuth(new Set(), false, false),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  const plan = planBootstrap(report, { claude: '2.1.206' });
  assertEquals(plan.changed, true);
  assertEquals(plan.desired, {
    node: '26.5.0',
    claude: '2.1.206',
    antigravity: 'official-installer',
  });
  assertEquals(plan.actions.map((action) => action.kind), [
    'create_directory',
    'install_node',
    'install_npm_clis',
    'install_antigravity',
    'migrate_legacy_gemini_ownership',
    'ensure_symlinks',
    'write_state',
  ]);
  const npmAction = plan.actions.find((action) => action.kind === 'install_npm_clis');
  assert(npmAction?.kind === 'install_npm_clis', 'npm action exists');
  assertEquals(npmAction.packages, [
    '@anthropic-ai/claude-code@2.1.206',
  ]);
});

Deno.test('bootstrap plan is empty when desired state is already present', () => {
  const report = buildDoctorReport({
    generatedAt: '2026-07-10T00:00:00.000Z',
    nativePath: { cwd: '/home/codex/repos/netscript', nativeExt4: true },
    components: [
      classifyComponent({ component: 'node', output: 'v26.5.0', exitCode: 0, expected: '26.5.0' }),
      classifyComponent({ component: 'claude', output: '2.1.206', exitCode: 0 }),
      classifyComponent({ component: 'antigravity', output: '1.1.1', exitCode: 0 }),
      classifyStateDirectory('state-claude', '.claude', true),
      classifyStateDirectory('state-codex', '.codex', true),
      classifyStateDirectory('state-antigravity', '.gemini', true),
      classifyStateDirectory('state-netscript-agentic', '.config/netscript-agentic', true),
      classifyAntigravityAuth(true, true),
      classifyLegacyGeminiOwnership(true, false, false),
    ],
    auth: classifyAuth(new Set(), true, true),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  const plan = planBootstrap(report, { claude: '2.1.206' });
  assertEquals(plan.changed, false);
  assertEquals(plan.actions, []);
});

Deno.test('rollback plan never removes Codex or provider session directories', () => {
  const rollback = buildRollbackPlan();
  assertEquals(rollback.destructive, false);
  assertEquals(rollback.windowsClaude, 'preserved');
  const rendered = JSON.stringify(rollback);
  assert(!rendered.includes('$HOME/.codex'), 'Codex home is not an owned rollback root');
  assert(
    rendered.includes('Preserve ~/.gemini, ~/.codex'),
    'provider state preservation is explicit',
  );
  assert(!rendered.includes('/root/.local/bin/agy'), 'root installation is outside rollback scope');
});
