import type { RouteIdentity } from './contract.ts';
import { LocalRuntimeStateAdapter } from './adapters/local-state-adapter.ts';
import {
  activateFallback,
  detectRoutingFailure,
  markProbeDue,
  MAX_ROUTING_HISTORY,
  recordRoutingCanary,
  restoreDesiredRoute,
} from './routing-state-machine.ts';
import type { PersistedRuntimeState } from './state.ts';
import { RUNTIME_SCHEMA_VERSION } from './contract.ts';
import { assertEquals as equal } from '@std/assert';

const worktree = '/home/codex/repos/routing-state';
const desiredRoute: RouteIdentity = {
  agent: 'codex',
  provider: 'openai',
  profileId: 'codex-openai-native',
  model: 'gpt',
  effort: 'high',
  worktree,
  mobileRequired: true,
};
const fallbackRoute: RouteIdentity = {
  agent: 'claude',
  provider: 'anthropic',
  profileId: 'claude-anthropic-native',
  model: 'claude',
  effort: 'low',
  worktree,
  mobileRequired: false,
};
const session = { agent: 'codex', sessionId: 'session-1', worktree, boundary: 'idle' } as const;
const resetAt = '2026-07-11T00:00:00.000Z';
function detected() {
  return detectRoutingFailure('routing-1', desiredRoute, session, {
    reason: 'quota',
    source: 'structured',
    resetAt,
  }, '2026-07-10T23:00:00.000Z');
}

Deno.test('fallback and restoration require boundaries, reset time, and successful canary', () => {
  const active = activateFallback(
    { ...detected(), affectedSession: { ...session, boundary: 'active' } },
    fallbackRoute,
    '2026-07-10T23:01:00.000Z',
    true,
  );
  equal(active.phase, 'blocked');
  const fallback = activateFallback(detected(), fallbackRoute, '2026-07-10T23:01:00.000Z', true);
  equal([fallback.phase, fallback.activeRoute, fallback.fallbackDepth], [
    'fallback_active',
    fallbackRoute,
    1,
  ]);
  equal(markProbeDue(fallback, '2026-07-10T23:59:59.000Z'), fallback);
  const due = markProbeDue(fallback, resetAt);
  equal(due.phase, 'probe_due');
  const ready = recordRoutingCanary(due, '2026-07-11T00:00:01.000Z', true);
  equal(ready.phase, 'restoration_ready');
  equal(
    restoreDesiredRoute(ready, { ...session, boundary: 'active' }, '2026-07-11T00:00:02.000Z')
      .phase,
    'blocked',
  );
  const restored = restoreDesiredRoute(
    ready,
    { ...session, boundary: 'new' },
    '2026-07-11T00:00:02.000Z',
  );
  equal([restored.phase, restored.activeRoute, restored.restorationStatus], [
    'restored',
    desiredRoute,
    'restored',
  ]);
});

Deno.test('failed canary records backoff and cannot probe early', () => {
  const fallback = activateFallback(detected(), fallbackRoute, '2026-07-10T23:01:00.000Z', false);
  const due = markProbeDue(fallback, resetAt);
  const failed = recordRoutingCanary(due, resetAt, false, 'probe_failed');
  equal([failed.phase, failed.nextProbeAt], ['probe_failed', '2026-07-11T00:05:00.000Z']);
  equal(markProbeDue(failed, '2026-07-11T00:04:59.000Z'), failed);
  equal(markProbeDue(failed, '2026-07-11T00:05:00.000Z').phase, 'probe_due');
});

Deno.test('routing state and bounded history survive a fresh local adapter', async () => {
  let routing = activateFallback(detected(), fallbackRoute, '2026-07-10T23:01:00.000Z', true);
  for (let index = 0; index < MAX_ROUTING_HISTORY + 5; index++) {
    routing = markProbeDue({
      ...routing,
      resetAt: '2026-07-10T00:00:00.000Z',
      nextProbeAt: undefined,
    }, `2026-07-11T00:${String(index).padStart(2, '0')}:00.000Z`);
  }
  equal(routing.transitions.length, MAX_ROUTING_HISTORY);
  const desired = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: 'desired',
    foundation: { nativeExt4: true as const, versions: {}, stateDirectories: [] },
    agents: {},
    worktrees: [],
    sessions: [],
  };
  const persisted: PersistedRuntimeState = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: 'controller',
    desired,
    checkpointIds: [],
    lastAppliedCommandId: null,
    routingStates: [routing],
  };
  const root = await Deno.makeTempDir();
  try {
    const adapter = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    await adapter.writeDesiredState(persisted);
    const fresh = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    // The store serializes to JSON (dropping `undefined` optionals); compare against
    // the JSON-normalized shape so this asserts round-trip fidelity, not in-memory
    // `undefined` keys the store never persists.
    equal(await fresh.readPersistedState(), JSON.parse(JSON.stringify(persisted)));
    equal((await Deno.stat(`${root}/runtime/controller-state.json`)).mode! & 0o777, 0o600);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
