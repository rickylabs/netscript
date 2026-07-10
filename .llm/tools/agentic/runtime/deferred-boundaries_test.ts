import { DEFERRED_ISSUES, RUNTIME_SCHEMA_VERSION, type RuntimeCommand } from './contract.ts';
import { planReconciliation } from './planner.ts';
import type { ObservedRuntimeState } from './state.ts';
import { assert, assertEquals } from '@std/assert';

const worktree = '/home/codex/repos/provider-profile-test';
const observed: ObservedRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'deferred-boundaries',
  nativeExt4: true,
  components: [],
  auth: [],
  stateDirectories: [],
  capabilities: {},
  worktrees: [{
    path: worktree,
    branch: 'feature',
    upstream: null,
    dirty: false,
    nativeExt4: true,
    found: true,
  }],
  sessions: [],
  configuredDesiredState: null,
  checkpoints: [],
};

function plan(command: RuntimeCommand) {
  return planReconciliation({ command, desired: null, observed });
}

Deno.test('deferred registry retains only future rollout issue 582', () => {
  assertEquals(DEFERRED_ISSUES, [582]);
});

Deno.test('Antigravity live evidence plans while controller apply remains unsupported', () => {
  const result = plan({
    kind: 'smoke',
    commandId: 'deferred-578',
    mode: 'plan',
    route: {
      agent: 'antigravity',
      provider: 'google',
      model: 'caller-model',
      effort: 'low',
      worktree,
      mobileRequired: false,
    },
    level: 'live',
  });
  assertEquals(result.status, 'planned');
  assertEquals(result.actions.map((entry) => entry.kind), ['smoke_session']);
  const apply = plan({
    kind: 'smoke',
    commandId: 'apply-580',
    mode: 'apply',
    route: {
      agent: 'antigravity',
      provider: 'google',
      model: 'caller-model',
      effort: 'low',
      worktree,
      mobileRequired: false,
    },
    level: 'live',
  });
  assertEquals(apply.diagnostics.map((entry) => [entry.code, entry.ownerIssue]), [
    ['capability_unsupported', undefined],
  ]);
});

Deno.test('all controller lifecycle apply paths point to the ownership-enforced launcher', () => {
  const routes = [
    {
      agent: 'claude',
      provider: 'anthropic',
      profileId: 'claude-anthropic-native',
      model: 'caller-model',
      effort: 'high',
    },
    {
      agent: 'codex',
      provider: 'openai',
      profileId: 'codex-openai-native',
      model: 'caller-model',
      effort: 'high',
    },
    {
      agent: 'codex',
      provider: 'openrouter',
      profileId: 'codex-openrouter',
      model: 'z-ai/glm-5.2',
      effort: 'xhigh',
    },
  ] as const;
  for (const [index, route] of routes.entries()) {
    const result = plan({
      kind: 'smoke',
      commandId: `unsupported-apply-${index}`,
      mode: 'apply',
      route: { ...route, worktree, mobileRequired: false },
      level: 'static',
    });
    assertEquals(result.diagnostics.map((entry) => [entry.code, entry.ownerIssue]), [
      ['capability_unsupported', undefined],
    ]);
    assert(result.diagnostics[0]?.message.includes('ownership-enforced agent launcher'));
  }
  const repair = plan({
    kind: 'repair-codex-remote',
    commandId: 'repair-580',
    mode: 'apply',
    worktree,
  });
  assertEquals(repair.actions.map((entry) => entry.kind), ['repair_codex_remote']);
  assertEquals(repair.diagnostics, []);
});

Deno.test('issue 582 rollout promotion remains absent rather than a hidden implementation', () => {
  const serialized = JSON.stringify(plan({
    kind: 'doctor',
    commandId: 'deferred-no-hidden-policy',
    mode: 'inspect',
  }));
  for (const forbidden of ['rollout_promotion', 'production_canary']) {
    assert(!serialized.includes(forbidden), `hidden deferred capability appeared: ${forbidden}`);
  }
});
