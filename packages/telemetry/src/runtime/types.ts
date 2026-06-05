/** Context supplied to telemetry instrumentation lifecycle hooks. */
export interface InstrumentationContext {
  /** Service name associated with the instrumentation lifecycle call. */
  readonly serviceName: string;
  /** Shared attributes applied by instrumentation setup or teardown hooks. */
  readonly attributes?: Record<string, string | number | boolean>;
}

/** Lifecycle registration for one telemetry instrumentation component. */
export interface InstrumentationRegistration {
  /** Unique instrumentation name within the registry. */
  readonly name: string;
  /** Optional hook that starts or attaches instrumentation resources. */
  readonly setup?: (context: InstrumentationContext) => void | Promise<void>;
  /** Optional hook that releases instrumentation resources. */
  readonly teardown?: (context: InstrumentationContext) => void | Promise<void>;
}

/** Snapshot of a registry entry for diagnostics and tests. */
export interface InstrumentationEntry {
  /** Registration name captured in the diagnostic snapshot. */
  readonly name: string;
  /** Whether the registration exposes a setup hook. */
  readonly hasSetup: boolean;
  /** Whether the registration exposes a teardown hook. */
  readonly hasTeardown: boolean;
}
