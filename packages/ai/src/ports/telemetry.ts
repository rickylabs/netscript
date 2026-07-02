/**
 * Telemetry port — the **only** telemetry seam in the AI stack.
 *
 * The core ships a no-op default so nothing observes by default and the core
 * takes no telemetry dependency. The real OpenTelemetry-backed adapter is slice
 * E9 (`@netscript/telemetry`) and MUST NOT be imported here — it is injected
 * into {@linkcode createAiRuntime} as a {@linkcode TelemetryPort}.
 *
 * @module
 */

/** Attribute values accepted by spans and events. */
export type TelemetryAttributeValue = string | number | boolean;

/** Bag of telemetry attributes. */
export type TelemetryAttributes = Readonly<Record<string, TelemetryAttributeValue>>;

/**
 * A minimal span handle. Adapters map this onto their tracer's span.
 */
export interface TelemetrySpan {
  /** Attach a single attribute to the span. */
  setAttribute(key: string, value: TelemetryAttributeValue): void;
  /** Record an exception against the span. */
  recordException(error: unknown): void;
  /** Close the span. */
  end(): void;
}

/**
 * The telemetry capability seam. Kept deliberately tiny — richer instrumentation
 * lives in the E9 adapter, not in this contract.
 */
export interface TelemetryPort {
  /** Start a named span with optional initial attributes. */
  startSpan(name: string, attributes?: TelemetryAttributes): TelemetrySpan;
  /** Record a point-in-time event. */
  recordEvent(name: string, attributes?: TelemetryAttributes): void;
}

const NOOP_SPAN: TelemetrySpan = {
  setAttribute(): void {},
  recordException(): void {},
  end(): void {},
};

/**
 * Create the no-op telemetry port used as the runtime default. Every method is
 * a safe no-op; spans returned do nothing.
 */
export function createNoopTelemetryPort(): TelemetryPort {
  return {
    startSpan(): TelemetrySpan {
      return NOOP_SPAN;
    },
    recordEvent(): void {},
  };
}
