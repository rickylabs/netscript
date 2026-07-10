// deno-fmt-ignore-file
import type { ReconcilePlan, RuntimeActionResult, RuntimeCommand, RuntimeDiagnostic, RuntimeResult } from './contract.ts';
import { RUNTIME_SCHEMA_VERSION } from './contract.ts';
import { foundationDiagnostics } from './adapters/foundation-adapter.ts';
// deno-fmt-ignore
import { buildPlanResult, buildReadFailureResult, buildRuntimeResult, projectAction, runtimeDiagnostic } from './output.ts';
import { planReconciliation } from './planner.ts';
// deno-fmt-ignore
import type { RuntimeMutationPorts, RuntimeReadFailure, RuntimeReadInput, RuntimeReadPorts } from './ports.ts';
import { inspectCheckpointOwnership, readRuntimeInput } from './ports.ts';
// deno-fmt-ignore
import { createRuntimeCheckpoint, type OwnedResourceState, type PersistedRuntimeState, type RuntimeCheckpointState } from './state.ts';

interface Prepared extends RuntimeReadInput { readonly plan: ReconcilePlan; }
interface Context { readonly command: RuntimeCommand; readonly start: string; readonly reads: RuntimeReadPorts; readonly prepared: Prepared; }
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

async function prepare(command: RuntimeCommand, reads: RuntimeReadPorts): Promise<Prepared | RuntimeReadFailure> {
  const input = await readRuntimeInput(command, reads);
  return 'failure' in input ? input : { ...input, plan: planReconciliation({ command, ...input }) };
}

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
async function compensate(checkpoint: RuntimeCheckpointState, reads: RuntimeReadPorts, writes: RuntimeMutationPorts, outcomes: RuntimeActionResult[]): Promise<{ resources: readonly OwnedResourceState[]; failures: RuntimeDiagnostic[]; preflight: RuntimeDiagnostic | null }> {
  const ownership = await inspectCheckpointOwnership(checkpoint, reads.ownedResourceReader);
  if (ownership.diagnostic) {
    return { resources: checkpoint.resources, failures: [], preflight: ownership.diagnostic };
  }
  const resources = [...ownership.resources];
  const failures: RuntimeDiagnostic[] = [];
  for (const resource of [...ownership.remaining].reverse()) {
    let failure: RuntimeDiagnostic | null;
    try {
      failure = await writes.actionCompensator.compensateAction(resource.action, resource);
    } catch {
      failure = runtimeDiagnostic('compensation_failed', 'rollback', 'action compensation failed');
    }
    if (!failure) try {
      const current = await reads.ownedResourceReader.readOwnedResourceFingerprint(resource.resourceId);
      if (current !== resource.beforeFingerprint) failure = runtimeDiagnostic('compensation_failed', 'rollback', 'compensation state did not match checkpoint');
    } catch { failure = runtimeDiagnostic('probe_failed', 'execution', 'compensation observation failed'); }
    const index = outcomes.findIndex((entry) => entry.id === resource.action.id);
    if (failure) failures.push(failure);
    if (index >= 0) outcomes[index] = projectAction(resource.action, failure ? 'failed' : 'compensated');
    if (!failure) {
      const resourceIndex = resources.findIndex((entry) => entry.resourceId === resource.resourceId);
      resources[resourceIndex] = { ...resource, rollbackState: 'compensated' };
    }
  }
  for (const resource of resources) {
    const index = outcomes.findIndex((entry) => entry.id === resource.action.id);
    if (index >= 0 && resource.rollbackState === 'compensated') outcomes[index] = projectAction(resource.action, 'compensated');
  }
  return { resources, failures, preflight: null };
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
    const failure = runtimeDiagnostic('invalid_checkpoint', 'state', 'runtime checkpoint is invalid');
    // deno-fmt-ignore
    return finish(context, values('failed', false, [], [failure]), command.checkpointId);
  }
  if (!checkpoint || !['applied', 'partial'].includes(checkpoint.status)) {
    const repeated = checkpoint?.status === 'rolled_back';
    const failures = repeated ? [] : [runtimeDiagnostic('rollback_refused', 'rollback', 'checkpoint is incomplete or not applied')];
    // deno-fmt-ignore
    return finish(context, values(repeated ? 'no_change' : 'blocked', false, [], failures), command.checkpointId);
  }
  const outcomes = checkpoint.resources.map((entry) => projectAction(entry.action, 'succeeded'));
  const rollback = await compensate(checkpoint, reads, writes, outcomes);
  if (rollback.preflight) {
    const status = rollback.preflight.category === 'execution' ? 'failed' : 'blocked';
    return finish(context, values(status, false, [], [rollback.preflight]), command.checkpointId);
  }
  const failures = rollback.failures;
  if (!failures.length) {
    const stateFailure = await writeState(writes, checkpoint.previousControllerState);
    if (stateFailure) failures.push(stateFailure);
  }
  const updated = { ...checkpoint, resources: rollback.resources };
  const writeFailure = await writeCheckpoint(writes, updated, failures.length ? 'partial' : 'rolled_back');
  if (writeFailure) failures.push(writeFailure);
  const status = failures.length ? 'partially_rolled_back' : 'rolled_back';
  // deno-fmt-ignore
  return finish(context, values(status, true, outcomes, failures), command.checkpointId);
}

function indexedState(prepared: Prepared, checkpoint: RuntimeCheckpointState): PersistedRuntimeState {
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: prepared.persisted?.stateId ?? `controller-${prepared.desired!.stateId}`,
    desired: prepared.persisted?.desired ?? prepared.desired!,
    checkpointIds: [...new Set([...(prepared.persisted?.checkpointIds ?? []), checkpoint.checkpointId])],
    lastAppliedCommandId: prepared.persisted?.lastAppliedCommandId ?? null,
  };
}

async function observeBefore(actions: ReconcilePlan['actions'], reads: RuntimeReadPorts): Promise<Map<string, string | null> | null> {
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
    const failure = runtimeDiagnostic('state_missing', 'state', 'apply requires configured desired state');
    // deno-fmt-ignore
    return finish(context, values('blocked', false, pending, [failure]));
  }
  const before = await observeBefore(actions, reads);
  if (!before) {
    const failure = runtimeDiagnostic('probe_failed', 'execution', 'owned resource observation failed');
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
    const failure = runtimeDiagnostic('ownership_conflict', 'safety', 'owned before state does not match reversible metadata');
    // deno-fmt-ignore
    return finish(context, values('blocked', false, pending, [failure]));
  }
  const outcomes = actions.map((action) => projectAction(action, 'pending'));
  const initialFailure = await writeCheckpoint(writes, checkpoint, 'prepared');
  if (initialFailure) {
    // deno-fmt-ignore
    return finish(context, values('failed', false, outcomes, [initialFailure]), checkpoint.checkpointId);
  }
  let activeCheckpoint = checkpoint;
  let primary: RuntimeDiagnostic | null = null;
  for (const [index, resource] of checkpoint.resources.entries()) {
    try {
      primary = await writes.actionExecutor.executeAction(resource.action);
    } catch {
      primary = runtimeDiagnostic('action_failed', 'execution', 'runtime action failed');
    }
    outcomes[index] = projectAction(resource.action, primary ? 'failed' : 'succeeded');
    if (primary) break;
    const resources = [...activeCheckpoint.resources];
    resources[index] = { ...resource, rollbackState: 'applied' };
    activeCheckpoint = { ...activeCheckpoint, resources };
    try {
      const current = await reads.ownedResourceReader.readOwnedResourceFingerprint(resource.resourceId);
      if (current !== resource.afterFingerprint) {
        primary = runtimeDiagnostic('ownership_conflict', 'execution', 'action state did not match checkpoint');
      }
    } catch {
      primary = runtimeDiagnostic('probe_failed', 'execution', 'post-action observation failed');
    }
    if (!primary) primary = await writeCheckpoint(writes, activeCheckpoint, 'prepared');
    if (primary) {
      outcomes[index] = projectAction(resource.action, 'failed');
      break;
    }
  }
  let stateWritten = false;
  let currentState: PersistedRuntimeState | null = null;
  if (!primary) {
    const next: PersistedRuntimeState = {
      schemaVersion: RUNTIME_SCHEMA_VERSION,
      stateId: prepared.persisted?.stateId ?? `controller-${prepared.desired.stateId}`,
      desired: prepared.desired,
      checkpointIds: [...new Set([...(prepared.persisted?.checkpointIds ?? []), checkpoint.checkpointId])],
      lastAppliedCommandId: command.commandId,
    };
    primary = await writeState(writes, next);
    stateWritten = !primary;
    currentState = stateWritten ? next : null;
  }
  if (!primary) {
    primary = await writeCheckpoint(writes, activeCheckpoint, 'applied');
    if (!primary) {
      // deno-fmt-ignore
      return finish(context, values('succeeded', true, outcomes), checkpoint.checkpointId);
    }
  }
  const rollback = await compensate(activeCheckpoint, reads, writes, outcomes);
  const failures = [...rollback.failures];
  if (rollback.preflight) failures.push(rollback.preflight);
  const partial = failures.length > 0;
  if (!partial && stateWritten) {
    const restoreFailure = await writeState(writes, checkpoint.previousControllerState);
    if (restoreFailure) failures.push(restoreFailure);
  }
  if (failures.length && !currentState) {
    const authorityFailure = await writeState(writes, indexedState(prepared, checkpoint));
    if (authorityFailure) failures.push(authorityFailure);
  }
  const updated = { ...activeCheckpoint, resources: rollback.resources };
  const finalFailure = await writeCheckpoint(writes, updated, failures.length ? 'partial' : 'rolled_back');
  if (finalFailure) failures.push(finalFailure);
  const status = failures.length ? 'partially_rolled_back' : 'failed';
  // deno-fmt-ignore
  return finish(context, values(status, failures.length > 0, outcomes, [primary, ...failures]), checkpoint.checkpointId);
}
