import {
  type ReconcilePlan,
  type RuntimeAction,
  type RuntimeActionResult,
  type RuntimeCommand,
  type RuntimeDiagnostic,
  type RuntimeResult,
} from './contract.ts';
import { foundationDiagnostics } from './adapters/foundation-adapter.ts';
import { buildRuntimeResult } from './output.ts';
import { planReconciliation } from './planner.ts';
import type { RuntimeMutationPorts, RuntimeReadPorts } from './ports.ts';
import {
  checkpointRollbackActions,
  createRuntimeCheckpoint,
  type DesiredRuntimeState,
  type ObservedRuntimeState,
  type RuntimeCheckpointState,
} from './state.ts';
type Code = RuntimeDiagnostic['code'];
type Category = RuntimeDiagnostic['category'];
type Command = RuntimeCommand;
function diagnostic(code: Code, category: Category, message: string): RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}
function actionResult(action: RuntimeAction, status: RuntimeActionResult['status']) {
  const { id, kind, adapter, effect, reversible } = action;
  return { id, kind, adapter, effect, reversible, status };
}
interface Prepared {
  readonly desired: DesiredRuntimeState | null;
  readonly observed: ObservedRuntimeState;
  readonly plan: ReconcilePlan;
}
function finish(
  command: RuntimeCommand,
  start: string,
  ports: RuntimeReadPorts,
  prepared: Prepared,
  values: Pick<RuntimeResult, 'status' | 'changed' | 'actions' | 'diagnostics'>,
  checkpointId?: string,
): RuntimeResult {
  return buildRuntimeResult(
    command,
    start,
    ports.clock.now(),
    prepared.desired,
    prepared.observed,
    values,
    checkpointId,
  );
}
async function prepare(command: RuntimeCommand, ports: RuntimeReadPorts): Promise<Prepared> {
  const base = await ports.inspector.observeRuntime();
  const persisted = await ports.persistedStateReader.readPersistedState();
  const ids = new Set(persisted?.checkpointIds ?? []);
  if (command.kind === 'rollback') ids.add(command.checkpointId);
  const checkpoints = await Promise.all(
    [...ids].map((id) => ports.checkpointReader.readCheckpoint(id)),
  );
  const observed = {
    ...base,
    configuredDesiredState: persisted?.desired ?? base.configuredDesiredState,
    checkpoints: checkpoints.flatMap((entry) =>
      entry
        ? [{ checkpointId: entry.checkpointId, commandId: entry.commandId, status: entry.status }]
        : []
    ),
  };
  const desired = command.kind === 'configure'
    ? await ports.desiredStateSource.loadDesiredState(command.desiredState)
    : persisted?.desired ?? null;
  return { desired, observed, plan: planReconciliation({ command, desired, observed }) };
}
function stateFailure(command: Command, start: string, end: string): RuntimeResult {
  return buildRuntimeResult(command, start, end, null, null, {
    status: 'failed',
    changed: false,
    actions: [],
    diagnostics: [
      diagnostic(
        command.kind === 'configure' ? 'invalid_state_file' : 'state_corrupt',
        command.kind === 'configure' ? 'input' : 'state',
        'runtime state could not be read or parsed',
      ),
    ],
  });
}
/** Observes and plans a command without accepting mutation ports. */
export async function runRuntimeCommand(
  command: RuntimeCommand,
  ports: RuntimeReadPorts,
): Promise<RuntimeResult> {
  const start = ports.clock.now();
  try {
    const prepared = await prepare(command, ports);
    const diagnostics = [...prepared.plan.diagnostics];
    if (command.kind === 'doctor' || command.kind === 'status') {
      diagnostics.push(
        ...foundationDiagnostics(
          prepared.observed,
          command.kind === 'status' ? command.agent : undefined,
        ),
      );
    }
    if (command.mode === 'apply' && prepared.plan.status !== 'blocked') {
      diagnostics.push(
        diagnostic(
          'capability_unsupported',
          'capability',
          'apply requires explicit mutation ports',
        ),
      );
    }
    const blocked = prepared.plan.status === 'blocked' || command.mode === 'apply';
    return finish(command, start, ports, prepared, {
      status: blocked ? 'blocked' : diagnostics.length ? 'degraded' : prepared.plan.status,
      changed: false,
      actions: prepared.plan.actions.map((action) => actionResult(action, 'pending')),
      diagnostics,
    }, command.kind === 'rollback' ? command.checkpointId : undefined);
  } catch {
    return stateFailure(command, start, ports.clock.now());
  }
}
async function writeCheckpoint(
  ports: RuntimeMutationPorts,
  checkpoint: RuntimeCheckpointState,
  status: RuntimeCheckpointState['status'],
): Promise<RuntimeDiagnostic | null> {
  try {
    await ports.checkpointWriter.writeCheckpoint({ ...checkpoint, status });
    return null;
  } catch {
    return diagnostic('state_write_failed', 'execution', 'checkpoint write failed');
  }
}
async function compensate(
  actions: readonly RuntimeAction[],
  ports: RuntimeMutationPorts,
  outcomes: RuntimeActionResult[],
): Promise<RuntimeDiagnostic[]> {
  const failures: RuntimeDiagnostic[] = [];
  for (const action of [...actions].reverse()) {
    let failure: RuntimeDiagnostic | null;
    try {
      failure = await ports.actionCompensator.compensateAction(action);
    } catch {
      failure = diagnostic('compensation_failed', 'rollback', 'action compensation failed');
    }
    const index = outcomes.findIndex((entry) => entry.id === action.id);
    if (failure) failures.push(failure);
    else if (index >= 0) outcomes[index] = actionResult(action, 'compensated');
  }
  return failures;
}
async function applyRollback(
  command: Extract<RuntimeCommand, { kind: 'rollback' }>,
  prepared: Prepared,
  reads: RuntimeReadPorts,
  writes: RuntimeMutationPorts,
  start: string,
): Promise<RuntimeResult> {
  const checkpoint = await reads.checkpointReader.readCheckpoint(command.checkpointId);
  if (!checkpoint || checkpoint.status !== 'applied') {
    const repeated = checkpoint?.status === 'rolled_back';
    return finish(command, start, reads, prepared, {
      status: repeated ? 'no_change' : 'blocked',
      changed: false,
      actions: [],
      diagnostics: repeated
        ? []
        : [diagnostic('rollback_refused', 'rollback', 'checkpoint is incomplete or not applied')],
    }, command.checkpointId);
  }
  const actions = checkpointRollbackActions(checkpoint);
  if (!actions || actions.length !== checkpoint.actionIds.length) {
    return finish(command, start, reads, prepared, {
      status: 'blocked',
      changed: false,
      actions: [],
      diagnostics: [
        diagnostic(
          'rollback_refused',
          'rollback',
          'checkpoint ownership or reversibility is invalid',
        ),
      ],
    }, command.checkpointId);
  }
  const outcomes = actions.map((action) => actionResult(action, 'succeeded'));
  const failures = await compensate(actions, writes, outcomes);
  const status = failures.length ? 'partial' : 'rolled_back';
  const writeFailure = await writeCheckpoint(writes, checkpoint, status);
  if (writeFailure) failures.push(writeFailure);
  return finish(command, start, reads, prepared, {
    status: failures.length
      ? (status === 'partial' ? 'partially_rolled_back' : 'failed')
      : 'rolled_back',
    changed: true,
    actions: outcomes,
    diagnostics: failures,
  }, command.checkpointId);
}
/** Applies one planned command only when explicit mutation ports are supplied. */
export async function applyRuntimeCommand(
  command: RuntimeCommand,
  reads: RuntimeReadPorts,
  writes: RuntimeMutationPorts,
): Promise<RuntimeResult> {
  const start = reads.clock.now();
  if (command.mode !== 'apply') return await runRuntimeCommand(command, reads);
  let prepared: Prepared;
  try {
    prepared = await prepare(command, reads);
    if (prepared.plan.status === 'blocked') return await runRuntimeCommand(command, reads);
    if (command.kind === 'rollback') {
      return await applyRollback(command, prepared, reads, writes, start);
    }
  } catch {
    return stateFailure(command, start, reads.clock.now());
  }
  const actions = prepared.plan.actions;
  if (!actions.length) {
    return finish(command, start, reads, prepared, {
      status: 'no_change',
      changed: false,
      actions: [],
      diagnostics: [],
    });
  }
  if (
    actions.some((action) =>
      !action.reversible || action.resourceIds.length !== 1 || action.id.length > 256 ||
      action.resourceIds[0].length > 256
    )
  ) {
    return finish(command, start, reads, prepared, {
      status: 'blocked',
      changed: false,
      actions: actions.map((action) => actionResult(action, 'pending')),
      diagnostics: [
        diagnostic('rollback_refused', 'rollback', 'apply plan contains an irreversible action'),
      ],
    });
  }
  const checkpoint = createRuntimeCheckpoint(command.commandId, reads.clock.now(), actions);
  const outcomes = actions.map((action) => actionResult(action, 'pending'));
  const initialFailure = await writeCheckpoint(writes, checkpoint, 'prepared');
  if (initialFailure) {
    return finish(command, start, reads, prepared, {
      status: 'failed',
      changed: false,
      actions: outcomes,
      diagnostics: [initialFailure],
    }, checkpoint.checkpointId);
  }
  const completed: RuntimeAction[] = [];
  let primary: RuntimeDiagnostic | null = null;
  for (const [index, action] of actions.entries()) {
    try {
      primary = await writes.actionExecutor.executeAction(action);
    } catch {
      primary = diagnostic('action_failed', 'execution', 'runtime action failed');
    }
    outcomes[index] = actionResult(action, primary ? 'failed' : 'succeeded');
    if (primary) break;
    completed.push(action);
  }
  if (!primary) {
    const appliedFailure = await writeCheckpoint(writes, checkpoint, 'applied');
    if (!appliedFailure) {
      return finish(command, start, reads, prepared, {
        status: 'succeeded',
        changed: true,
        actions: outcomes,
        diagnostics: [],
      }, checkpoint.checkpointId);
    }
    primary = appliedFailure;
  }
  const compensationFailures = await compensate(completed, writes, outcomes);
  const failures = [primary, ...compensationFailures];
  const partial = compensationFailures.length > 0;
  const finalFailure = await writeCheckpoint(
    writes,
    checkpoint,
    partial ? 'partial' : 'rolled_back',
  );
  if (finalFailure) failures.push(finalFailure);
  return finish(command, start, reads, prepared, {
    status: partial ? 'partially_rolled_back' : 'failed',
    changed: partial,
    actions: outcomes,
    diagnostics: failures,
  }, checkpoint.checkpointId);
}
