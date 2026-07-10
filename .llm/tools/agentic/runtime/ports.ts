/** Strict read and mutation port contracts for controller composition. */

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
  'summarizeContent',
  'probeProcess',
  'now',
] as const;

export const MUTATION_PORT_METHODS = [
  'writeDesiredState',
  'writeCheckpoint',
  'executeAction',
  'compensateAction',
] as const;

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

export interface RuntimeInspectorPort {
  observeRuntime(): Promise<ObservedRuntimeState>;
}

export interface PersistedStateReaderPort {
  readPersistedState(): Promise<PersistedRuntimeState | null>;
}

export interface DesiredStateSourcePort {
  loadDesiredState(reference: ContentReference): Promise<DesiredRuntimeState>;
}

export interface CheckpointReaderPort {
  readCheckpoint(checkpointId: string): Promise<RuntimeCheckpointState | null>;
}

export interface ContentReaderPort {
  summarizeContent(reference: ContentReference): Promise<ContentReferenceSummary>;
}

export interface ProcessProbePort {
  probeProcess(request: ProcessProbeRequest): Promise<ProcessProbeOutcome>;
}

export interface ClockPort {
  now(): string;
}

export interface RuntimeReadPorts {
  readonly inspector: RuntimeInspectorPort;
  readonly persistedStateReader: PersistedStateReaderPort;
  readonly desiredStateSource: DesiredStateSourcePort;
  readonly checkpointReader: CheckpointReaderPort;
  readonly contentReader: ContentReaderPort;
  readonly processProbe: ProcessProbePort;
  readonly clock: ClockPort;
}

export interface DesiredStateWriterPort {
  writeDesiredState(state: PersistedRuntimeState): Promise<void>;
}

export interface CheckpointWriterPort {
  writeCheckpoint(checkpoint: RuntimeCheckpointState): Promise<void>;
}

export interface RuntimeActionExecutorPort {
  executeAction(action: RuntimeAction): Promise<RuntimeDiagnostic | null>;
}

export interface RuntimeActionCompensatorPort {
  compensateAction(action: RuntimeAction): Promise<RuntimeDiagnostic | null>;
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

export interface RuntimePlanPort {
  plan(input: RuntimePlanInput): ReconcilePlan;
}
