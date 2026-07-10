import { LocalRuntimeStateAdapter } from './adapters/local-state-adapter.ts';
import { RUNTIME_SCHEMA_VERSION } from './contract.ts';
import { applyRuntimeCommand, runRuntimeCommand } from './controller.ts';
import type { RuntimeMutationPorts, RuntimeReadPorts } from './ports.ts';
import type { DesiredRuntimeState, ObservedRuntimeState } from './state.ts';
import { RUNTIME_TEST_COMPONENT_VERSIONS } from './test-fixtures.ts';

function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`actual ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
  }
}

const desired: DesiredRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'legacy-desired',
  foundation: { nativeExt4: true, versions: RUNTIME_TEST_COMPONENT_VERSIONS, stateDirectories: [] },
  agents: {},
  worktrees: [],
  sessions: [],
};
const observed: ObservedRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'legacy-observed',
  nativeExt4: true,
  components: [],
  auth: [],
  stateDirectories: [],
  capabilities: {},
  worktrees: [],
  sessions: [],
  configuredDesiredState: null,
  checkpoints: [],
};

Deno.test('exact schema-1.0 legacy checkpoint remains readable but unavailable inverse is refused', async () => {
  const root = await Deno.makeTempDir();
  try {
    const adapter = new LocalRuntimeStateAdapter(root, `${root}/foundation.json`);
    await Deno.writeTextFile(
      `${root}/controller-state.json`,
      JSON.stringify({
        schemaVersion: '1.0',
        stateId: 'legacy-controller',
        desired,
        checkpointIds: ['legacy-checkpoint'],
        lastAppliedCommandId: 'legacy-command',
      }),
    );
    await Deno.mkdir(`${root}/checkpoints`);
    await Deno.writeTextFile(
      `${root}/checkpoints/legacy-checkpoint.json`,
      JSON.stringify({
        schemaVersion: '1.0',
        checkpointId: 'legacy-checkpoint',
        commandId: 'legacy-command',
        createdAt: '2026-07-10T00:00:00.000Z',
        status: 'applied',
        resources: [{
          resourceId: 'state:legacy-desired',
          kind: 'configuration',
          action: {
            id: 'legacy-command:01:persist_desired_state',
            kind: 'persist_desired_state',
            adapter: 'state',
            effect: 'write',
            reversible: true,
            resourceIds: ['state:legacy-desired'],
            stateId: 'legacy-desired',
          },
          beforeFingerprint: 'sha256:legacy-before',
          afterFingerprint: 'sha256:legacy-after',
          previous: { kind: 'desired-state' },
        }],
        previousControllerState: null,
      }),
    );
    const checkpoint = await adapter.readCheckpoint('legacy-checkpoint');
    equal(checkpoint?.resources[0].rollbackState, 'applied');
    equal(checkpoint?.resources[0].legacyInverseUnavailable, true);
    const reads: RuntimeReadPorts = {
      inspector: { observeRuntime: () => Promise.resolve(observed) },
      persistedStateReader: adapter,
      desiredStateSource: adapter,
      checkpointReader: adapter,
      ownedResourceReader: {
        readOwnedResourceFingerprint: () => Promise.reject(new Error('must not read')),
      },
      contentReader: adapter,
      processProbe: {
        probeProcess: ({ probeId }) => Promise.resolve({ probeId, exitCode: 0, timedOut: false }),
      },
      clock: { now: () => '2026-07-10T00:00:00.000Z' },
    };
    const status = await runRuntimeCommand({
      kind: 'status',
      commandId: 'unrelated',
      mode: 'inspect',
    }, reads);
    equal([status.status, status.observedSummary.checkpoints], ['no_change', [{
      checkpointId: 'legacy-checkpoint',
      commandId: 'legacy-command',
      status: 'applied',
    }]]);
    const mutations: string[] = [];
    const writes: RuntimeMutationPorts = {
      desiredStateWriter: {
        writeDesiredState: () => {
          mutations.push('state');
          return Promise.resolve();
        },
      },
      checkpointWriter: {
        writeCheckpoint: () => {
          mutations.push('checkpoint');
          return Promise.resolve();
        },
      },
      actionExecutor: {
        executeAction: () => {
          mutations.push('execute');
          return Promise.resolve(null);
        },
      },
      actionCompensator: {
        compensateAction: () => {
          mutations.push('compensate');
          return Promise.resolve(null);
        },
      },
    };
    const rollback = await applyRuntimeCommand(
      {
        kind: 'rollback',
        commandId: 'legacy-rollback',
        mode: 'apply',
        checkpointId: 'legacy-checkpoint',
      },
      reads,
      writes,
    );
    equal([rollback.status, rollback.diagnostics[0]?.code, mutations], [
      'blocked',
      'rollback_refused',
      [],
    ]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
