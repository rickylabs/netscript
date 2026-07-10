import { planAntigravityCommand } from './adapters/antigravity-adapter.ts';
import {
  LocalRuntimeStateAdapter,
  parseDesiredRuntimeState,
} from './adapters/local-state-adapter.ts';
import type { RouteIdentity, RuntimeCommand } from './contract.ts';
import { assertEquals as equal } from '@std/assert';

const worktree = '/home/codex/repos/worktree';
const route: RouteIdentity = {
  agent: 'antigravity',
  provider: 'google',
  model: 'caller-model',
  effort: 'low',
  worktree,
  mobileRequired: false,
};
const legacyDesired = {
  schemaVersion: '1.0',
  stateId: 'legacy-gemini',
  foundation: {
    nativeExt4: true,
    versions: { node: '26.5.0', claude: '2.1.206', gemini: '0.50.0' },
    stateDirectories: ['gemini'],
  },
  agents: {
    gemini: {
      required: true,
      authRoute: 'google-subscription',
      route: { ...route, agent: 'gemini' },
    },
  },
  worktrees: [],
  sessions: [{ agent: 'gemini', sessionId: 'legacy-thread', worktree, boundary: 'idle' }],
};

Deno.test('legacy persisted Gemini desired state migrates explicitly to Antigravity vocabulary', () => {
  const migrated = parseDesiredRuntimeState(legacyDesired);
  equal(migrated.foundation.versions, { node: '26.5.0', claude: '2.1.206', antigravity: '0.50.0' });
  equal(migrated.foundation.stateDirectories, ['antigravity']);
  equal(migrated.agents.antigravity?.authRoute, 'google-sign-in');
  equal(migrated.agents.antigravity?.route?.agent, 'antigravity');
  equal(migrated.sessions[0].agent, 'antigravity');
});

Deno.test('ambiguous legacy and canonical Google CLI state is refused', () => {
  let rejected = false;
  try {
    parseDesiredRuntimeState({
      ...legacyDesired,
      foundation: {
        ...legacyDesired.foundation,
        versions: { ...legacyDesired.foundation.versions, antigravity: 'official-installer' },
      },
    });
  } catch {
    rejected = true;
  }
  equal(rejected, true);
});

Deno.test('legacy foundation manifest migrates without a Gemini executable alias', async () => {
  const root = await Deno.makeTempDir();
  try {
    const foundation = `${root}/foundation.json`;
    await Deno.writeTextFile(
      foundation,
      JSON.stringify({
        schemaVersion: '1.0',
        desired: { node: '26.5.0', claude: '2.1.206', gemini: '0.50.0' },
      }),
    );
    const state = await new LocalRuntimeStateAdapter(`${root}/runtime`, foundation)
      .readPersistedState();
    equal(state?.desired.foundation.versions.antigravity, '0.50.0');
    equal(state?.desired.agents.antigravity?.authRoute, 'google-sign-in');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('Antigravity static and bounded live probes use agy without a Gemini alias', () => {
  const staticCommand: Extract<RuntimeCommand, { kind: 'smoke' }> = {
    kind: 'smoke',
    commandId: 'agy-static',
    mode: 'plan',
    route,
    level: 'static',
  };
  const staticPlan = planAntigravityCommand({ command: staticCommand, nativeExt4: true });
  equal([staticPlan.request?.executable, staticPlan.request?.arguments], ['agy', ['--version']]);
  const live = planAntigravityCommand({
    command: { ...staticCommand, commandId: 'agy-live', level: 'live' },
    nativeExt4: true,
  });
  equal(live.request?.executable, 'agy');
  equal(live.request?.arguments.slice(0, 4), [
    '--print',
    '--print-timeout',
    '30000ms',
    '--sandbox',
  ]);
  equal(live.diagnostics, []);
  equal(JSON.stringify([staticPlan, live]).includes('agy login'), false);
  equal(JSON.stringify([staticPlan, live]).includes('executable":"gemini'), false);
});
