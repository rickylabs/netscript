/** Read-only observation and planning controller for runtime schema 1.0. */

import {
  RUNTIME_SCHEMA_VERSION,
  type RuntimeActionResult,
  type RuntimeCommand,
  type RuntimeDiagnostic,
  type RuntimeResult,
} from './contract.ts';
import { planReconciliation } from './planner.ts';
import type { RuntimeReadPorts } from './ports.ts';
import type { DesiredRuntimeState, ObservedRuntimeState } from './state.ts';

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
  ownerIssue?: RuntimeDiagnostic['ownerIssue'],
): RuntimeDiagnostic {
  return { code, category, retryable: false, message, ownerIssue };
}

function componentDiagnostic(
  component: ObservedRuntimeState['components'][number],
): RuntimeDiagnostic | null {
  const message = `foundation component ${component.component} is ${component.status}`;
  switch (component.status) {
    case 'ready':
      return null;
    case 'missing':
      return diagnostic('component_missing', 'compatibility', message);
    case 'outdated':
      return diagnostic('component_outdated', 'compatibility', message);
    case 'version_skew':
      return diagnostic('version_skew', 'compatibility', message);
    case 'auth_required':
      return diagnostic('auth_required', 'authentication', message);
    case 'auth_conflict':
      return diagnostic('auth_conflict', 'authentication', message);
    case 'unavailable':
      return diagnostic('probe_failed', 'execution', message);
  }
}

function observationDiagnostics(observed: ObservedRuntimeState): RuntimeDiagnostic[] {
  const diagnostics = observed.components.flatMap((component) => {
    const entry = componentDiagnostic(component);
    return entry ? [entry] : [];
  });
  for (const auth of observed.auth) {
    if (auth.status === 'ready') continue;
    diagnostics.push(
      diagnostic(
        auth.status === 'auth_required' ? 'auth_required' : 'auth_conflict',
        'authentication',
        `${auth.agent} authentication is ${auth.status}`,
      ),
    );
  }
  if (!observed.nativeExt4) {
    diagnostics.push(
      diagnostic('non_native_worktree', 'policy', 'runtime execution is not on native ext4'),
    );
  }
  if (observed.capabilities.codex === 'blocked') {
    diagnostics.push(
      diagnostic('mobile_disconnected', 'transport', 'Codex mobile control is unavailable'),
    );
  }
  return diagnostics;
}

function actionResults(
  actions: ReturnType<typeof planReconciliation>['actions'],
): RuntimeActionResult[] {
  return actions.map((action) => ({
    id: action.id,
    kind: action.kind,
    adapter: action.adapter,
    effect: action.effect,
    reversible: action.reversible,
    status: 'pending',
  }));
}

function duration(startedAt: string, completedAt: string): number {
  const value = Date.parse(completedAt) - Date.parse(startedAt);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function routeFor(command: RuntimeCommand) {
  if ('route' in command) return command.route;
  return command.kind === 'fallback' ? command.targetRoute : undefined;
}

function failureResult(
  command: RuntimeCommand,
  startedAt: string,
  completedAt: string,
  failure: RuntimeDiagnostic,
  observedStateId = 'unavailable',
): RuntimeResult {
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    commandId: command.commandId,
    command: command.kind,
    mode: command.mode,
    status: failure.category === 'capability' ? 'blocked' : 'failed',
    changed: false,
    desiredStateId: null,
    observedStateId,
    actions: [],
    diagnostics: [failure],
    route: routeFor(command),
    ...('checkpointId' in command ? { checkpointId: command.checkpointId } : {}),
    timing: { startedAt, completedAt, durationMs: duration(startedAt, completedAt) },
  };
}

async function desiredFor(
  command: RuntimeCommand,
  ports: RuntimeReadPorts,
  persisted: Awaited<ReturnType<RuntimeReadPorts['persistedStateReader']['readPersistedState']>>,
): Promise<DesiredRuntimeState | null> {
  if (command.kind === 'configure') {
    return await ports.desiredStateSource.loadDesiredState(command.desiredState);
  }
  return persisted?.desired ?? null;
}

async function mergeControllerState(
  observed: ObservedRuntimeState,
  ports: RuntimeReadPorts,
  persisted: Awaited<ReturnType<RuntimeReadPorts['persistedStateReader']['readPersistedState']>>,
): Promise<ObservedRuntimeState> {
  const checkpoints = await Promise.all(
    (persisted?.checkpointIds ?? []).map((id) => ports.checkpointReader.readCheckpoint(id)),
  );
  return {
    ...observed,
    configuredDesiredState: persisted?.desired ?? observed.configuredDesiredState,
    checkpoints: checkpoints.flatMap((checkpoint) =>
      checkpoint
        ? [{
          checkpointId: checkpoint.checkpointId,
          commandId: checkpoint.commandId,
          status: checkpoint.status,
        }]
        : []
    ),
  };
}

/** Observes and plans a command without accepting mutation ports. */
export async function runRuntimeCommand(
  command: RuntimeCommand,
  ports: RuntimeReadPorts,
): Promise<RuntimeResult> {
  const startedAt = ports.clock.now();
  let observedStateId = 'unavailable';
  let baseObserved: ObservedRuntimeState;
  try {
    baseObserved = await ports.inspector.observeRuntime();
  } catch {
    const completedAt = ports.clock.now();
    return failureResult(
      command,
      startedAt,
      completedAt,
      diagnostic('probe_failed', 'execution', 'runtime observation failed'),
    );
  }
  try {
    const persisted = await ports.persistedStateReader.readPersistedState();
    const observed = await mergeControllerState(baseObserved, ports, persisted);
    observedStateId = observed.stateId;
    const desired = await desiredFor(command, ports, persisted);
    const plan = planReconciliation({ command, desired, observed });
    const diagnostics = [...plan.diagnostics];
    if (command.kind === 'doctor' || command.kind === 'status') {
      diagnostics.push(...observationDiagnostics(observed));
    }
    if (command.mode === 'apply' && plan.status !== 'blocked') {
      const completedAt = ports.clock.now();
      return failureResult(
        command,
        startedAt,
        completedAt,
        diagnostic(
          'capability_unsupported',
          'capability',
          'apply execution is not available in the read-only S2 controller',
        ),
        observed.stateId,
      );
    }
    const completedAt = ports.clock.now();
    return {
      schemaVersion: RUNTIME_SCHEMA_VERSION,
      commandId: command.commandId,
      command: command.kind,
      mode: command.mode,
      status: plan.status === 'blocked'
        ? 'blocked'
        : diagnostics.length > 0
        ? 'degraded'
        : plan.status,
      changed: false,
      desiredStateId: desired?.stateId ?? null,
      observedStateId: observed.stateId,
      actions: actionResults(plan.actions),
      diagnostics,
      route: routeFor(command),
      ...('checkpointId' in command ? { checkpointId: command.checkpointId } : {}),
      timing: { startedAt, completedAt, durationMs: duration(startedAt, completedAt) },
    };
  } catch {
    const completedAt = ports.clock.now();
    return failureResult(
      command,
      startedAt,
      completedAt,
      diagnostic('invalid_state_file', 'input', 'runtime state could not be read or parsed'),
      observedStateId,
    );
  }
}
