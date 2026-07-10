import type {
  AgentKind,
  ContentReference,
  ReconcilePlan,
  RouteIdentity,
  RuntimeAction,
  RuntimeCommand,
  RuntimeDiagnostic,
} from './contract.ts';
import type {
  DesiredRuntimeState,
  ObservedRuntimeState,
  PersistedRuntimeState,
  RuntimeCheckpointState,
} from './state.ts';
export const READ_PORT_METHODS = [
  'observeRuntime',
  'readPersistedState',
  'loadDesiredState',
  'readCheckpoint',
  'readOwnedResourceFingerprint',
  'summarizeContent',
  'probeProcess',
  'now',
] as const;
// deno-fmt-ignore
export const MUTATION_PORT_METHODS = ['writeDesiredState', 'writeCheckpoint', 'executeAction', 'compensateAction'] as const;
export interface ContentReferenceSummary {
  readonly path: string;
  readonly bytes: number;
  readonly fingerprint: string;
}
export interface ProcessProbeRequest {
  readonly probeId: string;
  readonly executable: string;
  readonly arguments: readonly string[];
  readonly timeoutMs: number;
}
export interface ProcessProbeOutcome {
  readonly probeId: string;
  readonly exitCode: number;
  readonly timedOut: boolean;
  readonly diagnostic?: RuntimeDiagnostic;
}
export const AGENT_LIFECYCLE_OPERATIONS = ['launch', 'resume', 'smoke'] as const;
export type AgentLifecycleOperation = typeof AGENT_LIFECYCLE_OPERATIONS[number];
export interface AgentProcessRequest {
  readonly executable: string;
  readonly arguments: readonly string[];
  readonly cwd: string;
  readonly timeoutMs: number;
  readonly maxCaptureBytes: number;
}
export interface AgentCommandPlan {
  readonly agent: AgentKind;
  readonly operation: AgentLifecycleOperation;
  readonly route: RouteIdentity;
  readonly content?: ContentReference;
  readonly request: AgentProcessRequest | null;
  readonly diagnostics: readonly RuntimeDiagnostic[];
}
export type RuntimeInspectorPort = { observeRuntime(): Promise<ObservedRuntimeState> };
export type PersistedStateReaderPort = {
  readPersistedState(): Promise<PersistedRuntimeState | null>;
};
export type DesiredStateSourcePort = {
  loadDesiredState(reference: ContentReference): Promise<DesiredRuntimeState>;
};
export type CheckpointReaderPort = {
  readCheckpoint(checkpointId: string): Promise<RuntimeCheckpointState | null>;
};
export type OwnedResourceReaderPort = {
  readOwnedResourceFingerprint(resourceId: string): Promise<string | null>;
};
export type ContentReaderPort = {
  summarizeContent(reference: ContentReference): Promise<ContentReferenceSummary>;
};
export type ProcessProbePort = {
  probeProcess(request: ProcessProbeRequest): Promise<ProcessProbeOutcome>;
};
export type ClockPort = { now(): string };
export interface RuntimeReadPorts {
  readonly inspector: RuntimeInspectorPort;
  readonly persistedStateReader: PersistedStateReaderPort;
  readonly desiredStateSource: DesiredStateSourcePort;
  readonly checkpointReader: CheckpointReaderPort;
  readonly ownedResourceReader: OwnedResourceReaderPort;
  readonly contentReader: ContentReaderPort;
  readonly processProbe: ProcessProbePort;
  readonly clock: ClockPort;
}
export type DesiredStateWriterPort = {
  writeDesiredState(state: PersistedRuntimeState | null): Promise<void>;
};
export type CheckpointWriterPort = {
  writeCheckpoint(checkpoint: RuntimeCheckpointState): Promise<void>;
};
export type RuntimeActionExecutorPort = {
  executeAction(action: RuntimeAction): Promise<RuntimeDiagnostic | null>;
};
export interface RuntimeActionCompensatorPort {
  compensateAction(
    action: RuntimeAction,
    resource: import('./state.ts').OwnedResourceState,
  ): Promise<RuntimeDiagnostic | null>;
}
export interface RuntimeMutationPorts {
  readonly desiredStateWriter: DesiredStateWriterPort;
  readonly checkpointWriter: CheckpointWriterPort;
  readonly actionExecutor: RuntimeActionExecutorPort;
  readonly actionCompensator: RuntimeActionCompensatorPort;
}
export interface RuntimePlanInput {
  readonly command: RuntimeCommand;
  readonly desired: DesiredRuntimeState | null;
  readonly observed: ObservedRuntimeState;
}
export type RuntimePlanPort = { plan(input: RuntimePlanInput): ReconcilePlan };
export interface RuntimeReadInput {
  readonly desired: DesiredRuntimeState | null;
  readonly observed: ObservedRuntimeState;
  readonly persisted: PersistedRuntimeState | null;
}
export interface RuntimeReadFailure {
  readonly failure: RuntimeDiagnostic;
  readonly observed: ObservedRuntimeState | null;
}
function failure(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
  observed: ObservedRuntimeState | null,
): RuntimeReadFailure {
  return { failure: { code, category, retryable: false, message }, observed };
}
function ownershipIssue(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
): RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}
export async function readRuntimeInput(
  command: RuntimeCommand,
  ports: RuntimeReadPorts,
): Promise<RuntimeReadInput | RuntimeReadFailure> {
  let base: ObservedRuntimeState;
  try {
    base = await ports.inspector.observeRuntime();
  } catch {
    return failure('probe_failed', 'execution', 'runtime observation failed', null);
  }
  let persisted: PersistedRuntimeState | null;
  try {
    persisted = await ports.persistedStateReader.readPersistedState();
  } catch {
    return failure('state_corrupt', 'state', 'persisted runtime state is invalid', base);
  }
  const ids = new Set(persisted?.checkpointIds ?? []);
  if (command.kind === 'rollback') ids.add(command.checkpointId);
  let checkpoints: Array<RuntimeCheckpointState | null>;
  try {
    checkpoints = await Promise.all(
      [...ids].map((id) => ports.checkpointReader.readCheckpoint(id)),
    );
  } catch {
    const code = command.kind === 'rollback' ? 'invalid_checkpoint' : 'state_corrupt';
    return failure(code, 'state', 'runtime checkpoint is invalid', base);
  }
  const observed: ObservedRuntimeState = {
    ...base,
    configuredDesiredState: persisted?.desired ?? base.configuredDesiredState,
    checkpoints: checkpoints.flatMap((entry) =>
      entry
        ? [{ checkpointId: entry.checkpointId, commandId: entry.commandId, status: entry.status }]
        : []
    ),
  };
  let desired = persisted?.desired ?? null;
  if (command.kind === 'configure') {
    try {
      desired = await ports.desiredStateSource.loadDesiredState(command.desiredState);
    } catch {
      return failure('invalid_state_file', 'input', 'desired runtime state is invalid', observed);
    }
  }
  return { desired, observed, persisted };
}
export async function checkpointOwnershipDiagnostic(
  checkpoint: RuntimeCheckpointState,
  reader: OwnedResourceReaderPort,
): Promise<RuntimeDiagnostic | null> {
  const ids = new Set<string>();
  for (const resource of checkpoint.resources) {
    if (
      ids.has(resource.resourceId) || !resource.action.reversible ||
      resource.action.resourceIds.length !== 1 ||
      resource.action.resourceIds[0] !== resource.resourceId
    ) {
      return ownershipIssue(
        'rollback_refused',
        'rollback',
        'checkpoint ownership metadata is invalid',
      );
    }
    ids.add(resource.resourceId);
    let current: string | null;
    try {
      current = await reader.readOwnedResourceFingerprint(resource.resourceId);
    } catch {
      return ownershipIssue('probe_failed', 'execution', 'owned resource observation failed');
    }
    if (current !== resource.afterFingerprint) {
      return ownershipIssue('ownership_conflict', 'safety', 'owned resource changed after apply');
    }
  }
  return null;
}
