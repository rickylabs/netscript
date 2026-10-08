import type { CommandJson } from './values.ts';

/** Synchronous validation and I-JSON conversion for durable responses and side records. */
export interface CommandCodec<T> {
  /** Validate and encode a value before persistence. */
  encode(value: T): CommandJson;
  /** Validate persisted data before exposing its typed value. */
  decode(value: CommandJson): T;
}

/** Tighten the canonical protocol's fixed depth, aggregate-item and UTF-8 byte safeguards. */
export type CommandJsonLimits = Readonly<{
  /** Maximum container nesting; default and ceiling are 64. */
  depth?: number;
  /** Maximum value nodes plus object keys; default and ceiling are 10,000. */
  items?: number;
  /** Maximum canonical or stored UTF-8 bytes; default and ceiling are 1 MiB. */
  bytes?: number;
}>;
