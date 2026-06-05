/** State Protocol operation names supported by durable streams. */
export type Operation = 'insert' | 'update' | 'delete' | 'upsert';

/** Entity change event emitted by durable stream producers. */
export interface ChangeEvent<T = unknown> {
  /** State Protocol event type. */
  readonly type: string;
  /** Entity primary key. */
  readonly key: string;
  /** Optional operation headers. */
  readonly headers?: Record<string, unknown>;
  /** Entity value for insert, update, or upsert events. */
  readonly value?: T;
}

/** Control event emitted by durable streams for non-entity lifecycle changes. */
export interface ControlEvent {
  /** Control event type. */
  readonly type: string;
  /** Control event metadata. */
  readonly headers?: Record<string, unknown>;
}

/** Durable stream event union. */
export type StateEvent<T = unknown> = ChangeEvent<T> | ControlEvent;
