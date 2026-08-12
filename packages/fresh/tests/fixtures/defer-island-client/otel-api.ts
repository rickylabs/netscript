type SpanCallback<T> = () => T;

interface FixtureSpan {
  addEvent(): void;
  end(): void;
  recordException(): void;
  setAttributes(): void;
  setStatus(): void;
}

const span: FixtureSpan = {
  addEvent() {},
  end() {},
  recordException() {},
  setAttributes() {},
  setStatus() {},
};

/** Minimal OpenTelemetry context surface required by the client bundle fixture. */
export const context: {
  active(): object;
  with<T>(value: object, callback: SpanCallback<T>): T;
} = {
  active: () => ({}),
  with: (_value, callback) => callback(),
};

/** Minimal propagation surface retained by the telemetry facade exports. */
export const propagation: {
  extract(value: object): object;
  inject(value: object): void;
} = {
  extract: (value) => value,
  inject: () => {},
};

/** Minimal OpenTelemetry trace surface required by the client bundle fixture. */
export const trace: {
  getActiveSpan(): undefined;
  getSpanContext(): undefined;
  getTracer(): { startSpan(): FixtureSpan };
  setSpan(value: object, activeSpan: FixtureSpan): object;
  setSpanContext(value: object): object;
} = {
  getActiveSpan: () => undefined,
  getSpanContext: () => undefined,
  getTracer: () => ({ startSpan: () => span }),
  setSpan: (value) => value,
  setSpanContext: (value) => value,
};
