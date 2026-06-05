/** Telemetry instrumentation contribution. */
export interface TelemetryContribution {
  /** Instrumentation contribution name. */
  readonly name: string;
  /** Module path that installs the instrumentation. */
  readonly module: string;
}
