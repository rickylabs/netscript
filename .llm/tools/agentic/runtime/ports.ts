/** Strict read and mutation port contracts for controller composition. */

import type {
  ContentReference,
  ReconcilePlan,
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
  'readDesiredState',
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

export interface RuntimeInspectorPort {
  observeRuntime(): Promise<ObservedRuntimeState>;
}

export interface DesiredStateReaderPort {
  readDesiredState(): Promise<PersistedRuntimeState | null>;
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
  readonly desiredStateReader: DesiredStateReaderPort;
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
