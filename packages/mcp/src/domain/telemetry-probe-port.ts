/** Result returned by a telemetry endpoint reachability probe. */
export interface TelemetryProbeResult {
  /** Whether a response was received. */
  readonly reachable: boolean;
  /** HTTP status when a response was received. */
  readonly status?: number;
  /** Bounded probe summary. */
  readonly message: string;
}

/** External reachability capability consumed by the doctor flow. */
export interface TelemetryProbePort {
  /** Probe a telemetry base endpoint. */
  probe(endpoint: string): Promise<TelemetryProbeResult>;
}
