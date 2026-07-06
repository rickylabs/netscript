/**
 * In-memory span recorder for unit-testing telemetry instrumentation.
 *
 * Backs the `@netscript/telemetry/testing` subpath. {@linkcode InMemorySpanRecorder}
 * implements the vendor-neutral {@linkcode Tracer} contract and captures every
 * span it starts as a plain {@linkcode RecordedSpanSnapshot}, so tests can
 * assert on span names, attributes, events, links, and status without a live
 * OpenTelemetry provider.
 *
 * @module
 */

import {
  type AttributeValue,
  type Context,
  type Exception,
  type Link,
  type Span,
  type SpanContext,
  type SpanOptions,
  type SpanStatus,
  SpanStatusCode,
  type TimeInput,
  type Tracer,
} from '../domain/types.ts';

/**
 * A recorded span event captured by {@linkcode InMemorySpanRecorder}.
 */
export interface RecordedSpanEvent {
  /** Event name. */
  readonly name: string;
  /** Event attributes, when supplied. */
  readonly attributes?: Readonly<Record<string, AttributeValue | undefined>>;
}

/**
 * An immutable snapshot of a span captured by {@linkcode InMemorySpanRecorder}.
 */
export interface RecordedSpanSnapshot {
  /** Span name (reflects the latest `updateName`). */
  readonly name: string;
  /** Span context identifiers. */
  readonly spanContext: SpanContext;
  /** Span kind, when supplied at start. */
  readonly kind?: number;
  /** Flattened span attributes. */
  readonly attributes: Readonly<Record<string, AttributeValue | undefined>>;
  /** Recorded events, in insertion order. */
  readonly events: readonly RecordedSpanEvent[];
  /** Recorded links, in insertion order. */
  readonly links: readonly Link[];
  /** Recorded exceptions, in insertion order. */
  readonly exceptions: readonly Exception[];
  /** Latest span status. */
  readonly status: SpanStatus;
  /** Whether the span has ended. */
  readonly ended: boolean;
}

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

class RecordedSpan implements Span {
  readonly #context: SpanContext;
  #name: string;
  readonly #kind?: number;
  readonly #attributes: Record<string, AttributeValue | undefined> = {};
  readonly #events: RecordedSpanEvent[] = [];
  readonly #links: Link[] = [];
  readonly #exceptions: Exception[] = [];
  #status: SpanStatus = { code: SpanStatusCode.UNSET };
  #ended = false;

  constructor(name: string, options?: SpanOptions) {
    this.#name = name;
    this.#kind = options?.kind;
    this.#context = {
      traceId: randomHex(16),
      spanId: randomHex(8),
      traceFlags: 1,
    };
    if (options?.attributes) {
      this.setAttributes(options.attributes);
    }
    if (options?.links) {
      this.addLinks(options.links);
    }
  }

  spanContext(): SpanContext {
    return this.#context;
  }

  setAttribute(key: string, value: AttributeValue): this {
    this.#attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, AttributeValue | undefined>): this {
    for (const [key, value] of Object.entries(attributes)) {
      this.#attributes[key] = value;
    }
    return this;
  }

  addEvent(
    name: string,
    attributesOrStartTime?: Record<string, AttributeValue | undefined> | TimeInput,
    _startTime?: TimeInput,
  ): this {
    const attributes = attributesOrStartTime && typeof attributesOrStartTime === 'object' &&
        !Array.isArray(attributesOrStartTime) && !(attributesOrStartTime instanceof Date)
      ? attributesOrStartTime
      : undefined;
    this.#events.push({ name, attributes });
    return this;
  }

  addLink(link: Link): this {
    this.#links.push(link);
    return this;
  }

  addLinks(links: Link[]): this {
    this.#links.push(...links);
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.#status = status;
    return this;
  }

  updateName(name: string): this {
    this.#name = name;
    return this;
  }

  isRecording(): boolean {
    return !this.#ended;
  }

  recordException(exception: Exception, _time?: TimeInput): void {
    this.#exceptions.push(exception);
  }

  end(_endTime?: TimeInput): void {
    this.#ended = true;
  }

  snapshot(): RecordedSpanSnapshot {
    return {
      name: this.#name,
      spanContext: this.#context,
      kind: this.#kind,
      attributes: { ...this.#attributes },
      events: [...this.#events],
      links: [...this.#links],
      exceptions: [...this.#exceptions],
      status: this.#status,
      ended: this.#ended,
    };
  }
}

/**
 * A {@linkcode Tracer} implementation that records every span it starts in
 * memory for test assertions.
 *
 * The recorder does not perform real context propagation:
 * {@linkcode InMemorySpanRecorder.startActiveSpan} simply invokes the callback
 * with a freshly started span. Use {@linkcode InMemorySpanRecorder.snapshots}
 * to read captured spans and {@linkcode InMemorySpanRecorder.reset} to clear
 * them between cases.
 */
export class InMemorySpanRecorder implements Tracer {
  readonly #spans: RecordedSpan[] = [];

  /**
   * Start and record a span.
   *
   * @param name Span name.
   * @param options Optional span options (kind, attributes, links).
   * @param _context Ignored; the recorder does not thread parent context.
   */
  startSpan(name: string, options?: SpanOptions, _context?: Context): Span {
    const span = new RecordedSpan(name, options);
    this.#spans.push(span);
    return span;
  }

  /**
   * Start and record a span, then run a callback with it.
   *
   * @param name Span name.
   * @param fn Callback invoked with the started span.
   */
  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  /**
   * Start and record a span with explicit options, then run a callback with it.
   *
   * @param name Span name.
   * @param options Span options (kind, attributes, links).
   * @param fn Callback invoked with the started span.
   */
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: Span) => T): T;
  /**
   * Start and record a span with options and parent context, then run a
   * callback with it.
   *
   * @param name Span name.
   * @param options Span options (kind, attributes, links).
   * @param context Parent context (ignored by the recorder).
   * @param fn Callback invoked with the started span.
   */
  startActiveSpan<T>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: (span: Span) => T,
  ): T;
  /**
   * Start and record a span, then run a callback with it.
   *
   * @param name Span name.
   * @param optionsOrFn Span options, or the callback when no options are given.
   * @param contextOrFn Parent context, or the callback when no context is given.
   * @param maybeFn The callback when both options and context are given.
   * @returns The callback's return value.
   */
  startActiveSpan<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: Span) => T),
    contextOrFn?: Context | ((span: Span) => T),
    maybeFn?: (span: Span) => T,
  ): T {
    const fn = typeof optionsOrFn === 'function'
      ? optionsOrFn
      : typeof contextOrFn === 'function'
      ? contextOrFn
      : maybeFn;
    const options = typeof optionsOrFn === 'function' ? undefined : optionsOrFn;
    if (!fn) {
      throw new TypeError('startActiveSpan requires a callback');
    }
    return fn(this.startSpan(name, options));
  }

  /**
   * Return immutable snapshots of every recorded span, in start order.
   */
  snapshots(): readonly RecordedSpanSnapshot[] {
    return this.#spans.map((span) => span.snapshot());
  }

  /**
   * Return the number of spans recorded so far.
   */
  get size(): number {
    return this.#spans.length;
  }

  /**
   * Clear all recorded spans.
   */
  reset(): void {
    this.#spans.length = 0;
  }
}

/**
 * Create an {@linkcode InMemorySpanRecorder}.
 *
 * @returns A fresh in-memory recording tracer.
 * @example
 * ```ts
 * import { createInMemorySpanRecorder } from "@netscript/telemetry/testing";
 * import { withSpan } from "@netscript/telemetry";
 *
 * const recorder = createInMemorySpanRecorder();
 * await withSpan(recorder, "unit.work", (span) => span.setAttribute("ok", true));
 *
 * console.assert(recorder.snapshots()[0]?.name === "unit.work");
 * ```
 */
export function createInMemorySpanRecorder(): InMemorySpanRecorder {
  return new InMemorySpanRecorder();
}
