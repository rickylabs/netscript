/** Structured output event emitted by CLI flows before rendering. */
export type OutputEvent =
  | OutputTextEvent
  | OutputListEvent
  | OutputJsonEvent
  | OutputErrorEvent;

/** Human-readable text output. */
export interface OutputTextEvent {
  readonly kind: 'text';
  readonly text: string;
  readonly stream?: OutputStream;
}

/** Ordered list output. */
export interface OutputListEvent {
  readonly kind: 'list';
  readonly items: readonly string[];
  readonly stream?: OutputStream;
}

/** Machine-readable JSON output. */
export interface OutputJsonEvent {
  readonly kind: 'json';
  readonly value: unknown;
  readonly stream?: OutputStream;
}

/** Error output rendered at the binary edge. */
export interface OutputErrorEvent {
  readonly kind: 'error';
  readonly message: string;
  readonly code?: number;
  readonly context?: Readonly<Record<string, unknown>>;
}

/** Output destination selected by renderers. */
export type OutputStream = 'stdout' | 'stderr';
