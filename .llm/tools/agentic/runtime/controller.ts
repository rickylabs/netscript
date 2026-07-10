// deno-fmt-ignore
import type { ReconcilePlan, RuntimeActionResult, RuntimeCommand, RuntimeDiagnostic, RuntimeResult } from './contract.ts';
import { RUNTIME_SCHEMA_VERSION } from './contract.ts';
import { foundationDiagnostics } from './adapters/foundation-adapter.ts';
// deno-fmt-ignore
import { buildPlanResult, buildReadFailureResult, buildRuntimeResult, projectAction, runtimeDiagnostic } from './output.ts';
import { planReconciliation } from './planner.ts';
// deno-fmt-ignore
import type { RuntimeMutationPorts, RuntimeReadFailure, RuntimeReadInput, RuntimeReadPorts } from './ports.ts';
import { checkpointOwnershipDiagnostic, readRuntimeInput } from './ports.ts';
// deno-fmt-ignore
import { createRuntimeCheckpoint, type OwnedResourceState, type PersistedRuntimeState, type RuntimeCheckpointState } from './state.ts';

interface Prepared extends RuntimeReadInput {
  readonly plan: ReconcilePlan;
}
interface Context {
  readonly command: RuntimeCommand;
  readonly start: string;
  readonly reads: RuntimeReadPorts;
  readonly prepared: Prepared;
}
type Values = Pick<RuntimeResult, 'status' | 'changed' | 'actions' | 'diagnostics'>;
// deno-fmt-ignore
function values(status: Values['status'], changed: boolean, actions: Values['actions'] = [], diagnostics: Values['diagnostics'] = []): Values {
  return { status, changed, actions, diagnostics };
}

function finish(context: Context, values: Values, checkpointId?: string): RuntimeResult {
  const { command, start, reads, prepared } = context;
  // deno-fmt-ignore
  return buildRuntimeResult(command, start, reads.clock.now(), prepared.desired, prepared.observed, values, checkpointId);
}

async function prepare(
  command: RuntimeCommand,
  reads: RuntimeReadPorts,
): Promise<Prepared | RuntimeReadFailure> {
  const input = await readRuntimeInput(command, reads);
  return 'failure' in input ? input : { ...input, plan: planReconciliation({ command, ...input }) };
}

/** Observes and plans a command without accepting mutation ports. */
export async function runRuntimeCommand(
  command: RuntimeCommand,
  reads: RuntimeReadPorts,
): Promise<RuntimeResult> {
  const start = reads.clock.now();
  const prepared = await prepare(command, reads);
  if ('failure' in prepared) {
    // deno-fmt-ignore
    return buildReadFailureResult(command, start, reads.clock.now(), prepared.observed, prepared.failure);
  }
  const diagnostics = command.kind === 'doctor' || command.kind === 'status'
    ? foundationDiagnostics(
      prepared.observed,
      command.kind === 'status' ? command.agent : undefined,
    )
    : [];
  if (command.mode === 'apply' && prepared.plan.status !== 'blocked') {
    diagnostics.push(
      runtimeDiagnostic(
        'capability_unsupported',
        'capability',
        'apply requires explicit mutation ports',
      ),
    );
  }
  // deno-fmt-ignore
  return buildPlanResult(command, start, reads.clock.now(), prepared.desired, prepared.observed, prepared.plan, diagnostics);
}

// deno-fmt-ignore
async function writeCheckpoint(writes: RuntimeMutationPorts, checkpoint: RuntimeCheckpointState, status: RuntimeCheckpointState['status']): Promise<RuntimeDiagnostic | null> {
  try {
    await writes.checkpointWriter.writeCheckpoint({ ...checkpoint, status });
    return null;
  } catch {
    return runtimeDiagnostic('state_write_failed', 'execution', 'checkpoint write failed');
  }
}

// deno-fmt-ignore
async function writeState(writes: RuntimeMutationPorts, state: PersistedRuntimeState | null): Promise<RuntimeDiagnostic | null> {
  try {
    await writes.desiredStateWriter.writeDesiredState(state);
    return null;
  } catch {
    return runtimeDiagnostic('state_write_failed', 'execution', 'controller state write failed');
  }
}

// deno-fmt-ignore
async function compensate(resources: readonly OwnedResourceState[], writes: RuntimeMutationPorts, outcomes: RuntimeActionResult[]): Promise<RuntimeDiagnostic[]> {
  const failures: RuntimeDiagnostic[] = [];
  for (const resource of [...resources].reverse()) {
    let failure: RuntimeDiagnostic | null;
    try {
      failure = await writes.actionCompensator.compensateAction(resource.action, resource);
    } catch {
      failure = runtimeDiagnostic('compensation_failed', 'rollback', 'action compensation failed');
    }
    const index = outcomes.findIndex((entry) => entry.id === resource.action.id);
    if (failure) failures.push(failure);
    if (index >= 0) {
      outcomes[index] = projectAction(resource.action, failure ? 'failed' : 'compensated');
    }
  }
  return failures;
}

async function applyRollback(
  context: Context & { readonly command: Extract<RuntimeCommand, { kind: 'rollback' }> },
  writes: RuntimeMutationPorts,
): Promise<RuntimeResult> {
  const { command, prepared, reads } = context;
  let checkpoint: RuntimeCheckpointState | null;
  try {
    checkpoint = await reads.checkpointReader.readCheckpoint(command.checkpointId);
  } catch {
    const failure = runtimeDiagnostic(
      'invalid_checkpoint',
      'state',
      'runtime checkpoint is invalid',
    );
    // deno-fmt-ignore
    return finish(context, values('failed', false, [], [failure]), command.checkpointId);
  }
  if (!checkpoint || checkpoint.status !== 'applied') {
    const repeated = checkpoint?.status === 'rolled_back';
    const failures = repeated ? [] : [runtimeDiagnostic(
      'rollback_refused',
      'rollback',
      'checkpoint is incomplete or not applied',
    )];
    // deno-fmt-ignore
    return finish(context, values(repeated ? 'no_change' : 'blocked', false, [], failures), command.checkpointId);
  }
  const conflict = await checkpointOwnershipDiagnostic(checkpoint, reads.ownedResourceReader);
  if (conflict) {
    // deno-fmt-ignore
    return finish(context, values('blocked', false, [], [conflict]), command.checkpointId);
  }
  const outcomes = checkpoint.resources.map((entry) => projectAction(entry.action, 'succeeded'));
  const failures = await compensate(checkpoint.resources, writes, outcomes);
  const stateFailure = await writeState(writes, checkpoint.previousControllerState);
  if (stateFailure) failures.push(stateFailure);
  const writeFailure = await writeCheckpoint(
    writes,
    checkpoint,
    failures.length ? 'partial' : 'rolled_back',
  );
  if (writeFailure) failures.push(writeFailure);
  const status = failures.length ? 'partially_rolled_back' : 'rolled_back';
  // deno-fmt-ignore
  return finish(context, values(status, true, outcomes, failures), command.checkpointId);
}

async function observeBefore(
  actions: ReconcilePlan['actions'],
  reads: RuntimeReadPorts,
): Promise<Map<string, string | null> | null> {
  const before = new Map<string, string | null>();
  try {
    for (const action of actions) {
      const id = action.resourceIds[0];
      before.set(id, await reads.ownedResourceReader.readOwnedResourceFingerprint(id));
    }
    return before;
  } catch {
    return null;
  }
}

/** Applies one planned command only when explicit mutation ports are supplied. */
export async function applyRuntimeCommand(
  command: RuntimeCommand,
  reads: RuntimeReadPorts,
  writes: RuntimeMutationPorts,
): Promise<RuntimeResult> {
  const start = reads.clock.now();
  if (command.mode !== 'apply') return await runRuntimeCommand(command, reads);
  const prepared = await prepare(command, reads);
  if ('failure' in prepared) {
    // deno-fmt-ignore
    return buildReadFailureResult(command, start, reads.clock.now(), prepared.observed, prepared.failure);
  }
  if (prepared.plan.status === 'blocked') {
    // deno-fmt-ignore
    return buildPlanResult(command, start, reads.clock.now(), prepared.desired, prepared.observed, prepared.plan);
  }
  const context = { command, start, reads, prepared };
  if (command.kind === 'rollback') {
    return await applyRollback({ ...context, command }, writes);
  }
  const actions = prepared.plan.actions;
  if (!actions.length) {
    return finish(context, values('no_change', false));
  }
  if (!prepared.desired) {
    const pending = actions.map((entry) => projectAction(entry, 'pending'));
    const failure = runtimeDiagnostic(
      'state_missing',
      'state',
      'apply requires configured desired state',
    );
    // deno-fmt-ignore
    return finish(context, values('blocked', false, pending, [failure]));
  }
  const before = await observeBefore(actions, reads);
  if (!before) {
    const failure = runtimeDiagnostic(
      'probe_failed',
      'execution',
      'owned resource observation failed',
    );
    // deno-fmt-ignore
    return finish(context, values('failed', false, [], [failure]));
  }
  const checkpoint = await createRuntimeCheckpoint(
    command,
    reads.clock.now(),
    actions,
    prepared.persisted,
    prepared.desired,
    prepared.observed,
    before,
  );
  if (!checkpoint) {
    const pending = actions.map((entry) => projectAction(entry, 'pending'));
    const failure = runtimeDiagnostic(
      'rollback_refused',
      'rollback',
      'apply lacks exact reversible metadata',
    );
    // deno-fmt-ignore
    return finish(context, values('blocked', false, pending, [failure]));
  }
  const outcomes = actions.map((action) => projectAction(action, 'pending'));
  const initialFailure = await writeCheckpoint(writes, checkpoint, 'prepared');
  if (initialFailure) {
    // deno-fmt-ignore
    return finish(context, values('failed', false, outcomes, [initialFailure]), checkpoint.checkpointId);
  }
  const completed: OwnedResourceState[] = [];
  let primary: RuntimeDiagnostic | null = null;
  for (const [index, resource] of checkpoint.resources.entries()) {
    try {
      primary = await writes.actionExecutor.executeAction(resource.action);
    } catch {
      primary = runtimeDiagnostic('action_failed', 'execution', 'runtime action failed');
    }
    outcomes[index] = projectAction(resource.action, primary ? 'failed' : 'succeeded');
    if (primary) break;
    completed.push(resource);
  }
  let stateWritten = false;
  if (!primary) {
    const next: PersistedRuntimeState = {
      schemaVersion: RUNTIME_SCHEMA_VERSION,
      stateId: prepared.persisted?.stateId ?? `controller-${prepared.desired.stateId}`,
      desired: prepared.desired,
      checkpointIds: [
        ...new Set([
          ...(prepared.persisted?.checkpointIds ?? []),
          checkpoint.checkpointId,
        ]),
      ],
      lastAppliedCommandId: command.commandId,
    };
    primary = await writeState(writes, next);
    stateWritten = !primary;
  }
  if (!primary) {
    primary = await writeCheckpoint(writes, checkpoint, 'applied');
    if (!primary) {
      // deno-fmt-ignore
      return finish(context, values('succeeded', true, outcomes), checkpoint.checkpointId);
    }
  }
  const failures = await compensate(completed, writes, outcomes);
  if (stateWritten) {
    const restoreFailure = await writeState(writes, checkpoint.previousControllerState);
    if (restoreFailure) failures.push(restoreFailure);
  }
  const finalFailure = await writeCheckpoint(
    writes,
    checkpoint,
    failures.length ? 'partial' : 'rolled_back',
  );
  if (finalFailure) failures.push(finalFailure);
  const status = failures.length ? 'partially_rolled_back' : 'failed';
  // deno-fmt-ignore
  return finish(context, values(status, failures.length > 0, outcomes, [primary, ...failures]), checkpoint.checkpointId);
}
