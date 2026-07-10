import {
  buildDoctorReport,
  buildRollbackPlan,
  classifyAntigravityAuth,
  classifyAntigravityInstallOwnership,
  classifyAuth,
  classifyCanonicalAgyOwnership,
  classifyComponent,
  classifyLegacyGeminiOwnership,
  classifyMobileControl,
  classifyStateDirectory,
  FOUNDATION_SCHEMA_VERSION,
  parseVersion,
  planBootstrap,
} from './wsl-foundation-lib.ts';
import { executeBootstrap, installAntigravity, readJsonObject } from './wsl-foundation.ts';
import { assert, assertEquals } from '@std/assert';

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
  assertEquals(classifyLegacyGeminiOwnership('missing', false, false).status, 'ready');
  assertEquals(classifyLegacyGeminiOwnership('valid', true, true).status, 'outdated');
  assertEquals(classifyLegacyGeminiOwnership('valid', true, false).status, 'auth_conflict');
  assertEquals(classifyLegacyGeminiOwnership('invalid', false, false).status, 'auth_conflict');
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
      classifyLegacyGeminiOwnership('valid', true, true),
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
    'create_directory',
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
      classifyAntigravityInstallOwnership('missing', true),
      classifyLegacyGeminiOwnership('valid', false, false),
    ],
    auth: classifyAuth(new Set(), true, true),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  const plan = planBootstrap(report, { claude: '2.1.206' });
  assertEquals(plan.changed, false);
  assertEquals(plan.actions, []);
});

Deno.test('Antigravity-only install creates the owned root before writing its installer', () => {
  const report = buildDoctorReport({
    generatedAt: '2026-07-10T00:00:00.000Z',
    nativePath: { cwd: '/home/codex/repos/netscript', nativeExt4: true },
    components: [
      classifyComponent({ component: 'node', output: 'v26.5.0', exitCode: 0, expected: '26.5.0' }),
      classifyComponent({ component: 'claude', output: '2.1.206', exitCode: 0 }),
      classifyComponent({ component: 'antigravity', output: '', exitCode: 127 }),
      classifyAntigravityAuth(false, false),
      classifyAntigravityInstallOwnership('missing', false),
      classifyLegacyGeminiOwnership('missing', false, false),
    ],
    auth: classifyAuth(new Set(), true, false),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  const plan = planBootstrap(report, { claude: '2.1.206' });
  const kinds = plan.actions.map((action) => action.kind);
  assertEquals(kinds.slice(0, 2), ['create_directory', 'install_antigravity']);
  assertEquals(
    plan.actions[0],
    { kind: 'create_directory', relativePath: '.local/share/netscript-agentic' },
  );
});

Deno.test('unfinished Antigravity install is recoverable into the ownership manifest', () => {
  const report = buildDoctorReport({
    generatedAt: '2026-07-10T00:00:00.000Z',
    nativePath: { cwd: '/home/codex/repos/netscript', nativeExt4: true },
    components: [
      classifyComponent({ component: 'node', output: 'v26.5.0', exitCode: 0, expected: '26.5.0' }),
      classifyComponent({ component: 'claude', output: '2.1.206', exitCode: 0 }),
      classifyComponent({ component: 'antigravity', output: '1.1.1', exitCode: 0 }),
      classifyAntigravityAuth(true, true),
      classifyAntigravityInstallOwnership('valid', true),
      classifyLegacyGeminiOwnership('valid', false, false),
    ],
    auth: classifyAuth(new Set(), true, true),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  const plan = planBootstrap(report, { claude: '2.1.206' });
  assertEquals(plan.actions.map((action) => action.kind), [
    'recover_antigravity_ownership',
    'write_state',
  ]);
});

Deno.test('canonical recovery rejects wrong-owner and non-executable agy metadata', () => {
  const wrongOwner = classifyCanonicalAgyOwnership(true, true, false);
  assertEquals(wrongOwner.ready, false);
  assert(wrongOwner.detail.includes('not owned by the current user'), 'wrong owner is actionable');
  const nonExecutable = classifyCanonicalAgyOwnership(true, false, true);
  assertEquals(nonExecutable.ready, false);
  assert(nonExecutable.detail.includes('not owner-executable'), 'mode failure is actionable');
  assertEquals(classifyCanonicalAgyOwnership(true, true, true).ready, true);
});

Deno.test('non-executable agy cannot finalize ownership or remove recovery journal', async () => {
  const home = await makeRecoveryHome(0o600);
  try {
    let rejected = false;
    try {
      await executeBootstrap(home, recoveryPlan());
    } catch (error) {
      rejected = String(error).includes('not owner-executable');
    }
    assert(rejected, 'non-executable recovery fails with actionable detail');
    assert(
      await pathIsFile(`${home}/.config/netscript-agentic/agy-install-pending.json`),
      'journal retained',
    );
    const state = await readJsonObject(`${home}/.config/netscript-agentic/foundation-state.json`);
    assert(state.status === 'valid', 'state remains valid');
    assertEquals(state.value.createdFiles, []);
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});

Deno.test('valid canonical agy recovery finalizes ownership then removes journal', async () => {
  const home = await makeRecoveryHome(0o700);
  try {
    await executeBootstrap(home, recoveryPlan());
    const state = await readJsonObject(`${home}/.config/netscript-agentic/foundation-state.json`);
    assert(state.status === 'valid', 'state is valid');
    assertEquals(state.value.createdFiles, [`${home}/.local/bin/agy`]);
    assert(
      !(await pathIsFile(`${home}/.config/netscript-agentic/agy-install-pending.json`)),
      'journal removed after finalization',
    );
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});

Deno.test('installer creates its root and durable journal before execution', async () => {
  const home = await Deno.makeTempDir({ prefix: 'netscript-agy-install-' });
  try {
    await installAntigravity(home, '1.0', 'https://antigravity.google/cli/install.sh', {
      fetchText: () => Promise.resolve('#!/usr/bin/env bash\n'),
      execute: async (scriptPath) => {
        assert(await pathIsFile(scriptPath), 'installer script exists beneath the owned root');
        const journal = await readJsonObject(
          `${home}/.config/netscript-agentic/agy-install-pending.json`,
        );
        assertEquals(journal.status, 'valid');
        await Deno.mkdir(`${home}/.local/bin`, { recursive: true });
        await Deno.writeTextFile(`${home}/.local/bin/agy`, 'installed');
        return { code: 0, stdout: '', stderr: '' };
      },
    });
    assert(
      await pathIsFile(`${home}/.config/netscript-agentic/agy-install-pending.json`),
      'journal survives until manifest finalization',
    );
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});

Deno.test('malformed ownership manifest is invalid rather than missing', async () => {
  const path = await Deno.makeTempFile({ prefix: 'netscript-foundation-state-' });
  try {
    await Deno.writeTextFile(path, '{not-json');
    assertEquals((await readJsonObject(path)).status, 'invalid');
  } finally {
    await Deno.remove(path);
  }
});

Deno.test('unreadable ownership manifest is invalid rather than missing', async () => {
  const path = await Deno.makeTempFile({ prefix: 'netscript-foundation-state-' });
  try {
    await Deno.writeTextFile(path, '{}');
    await Deno.chmod(path, 0o000);
    assertEquals((await readJsonObject(path)).status, 'invalid');
  } finally {
    await Deno.chmod(path, 0o600);
    await Deno.remove(path);
  }
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
  assert(rendered.includes('agy-install-pending.json'), 'interrupted install is recoverable');
  assert(!rendered.includes('/root/.local/bin/agy'), 'root installation is outside rollback scope');
});

async function pathIsFile(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}

function recoveryPlan() {
  return {
    schemaVersion: '1.0' as const,
    desired: { node: '26.5.0', claude: '2.1.206', antigravity: 'official-installer' as const },
    actions: [
      { kind: 'recover_antigravity_ownership' as const },
      {
        kind: 'write_state' as const,
        relativePath: '.config/netscript-agentic/foundation-state.json',
      },
    ],
    changed: true,
  };
}

async function makeRecoveryHome(agyMode: number): Promise<string> {
  const home = await Deno.makeTempDir({ prefix: 'netscript-agy-recovery-' });
  await Deno.mkdir(`${home}/.local/bin`, { recursive: true });
  await Deno.mkdir(`${home}/.config/netscript-agentic`, { recursive: true });
  await Deno.writeTextFile(`${home}/.local/bin/agy`, 'installed', { mode: agyMode });
  await Deno.writeTextFile(
    `${home}/.config/netscript-agentic/agy-install-pending.json`,
    JSON.stringify({ schemaVersion: '1.0', ownedExecutable: `${home}/.local/bin/agy` }),
  );
  await Deno.writeTextFile(
    `${home}/.config/netscript-agentic/foundation-state.json`,
    JSON.stringify({ createdFiles: [], previousTargets: {}, migrations: {} }),
  );
  return home;
}
