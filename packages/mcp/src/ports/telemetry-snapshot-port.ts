import type {
  TelemetrySnapshot,
  TelemetrySnapshotFailure,
  TelemetrySnapshotRequest,
} from '../domain/telemetry/telemetry-snapshot.ts';

/** Read a single project-bound telemetry snapshot; implement this to extend backend acquisition. */
export interface TelemetrySnapshotPort {
  /** Acquire evidence under one cancellation/deadline boundary, preserving failure versus empty. */
  readSnapshot(
    request: TelemetrySnapshotRequest,
    signal: AbortSignal,
  ): Promise<TelemetrySnapshot | TelemetrySnapshotFailure>;
}
