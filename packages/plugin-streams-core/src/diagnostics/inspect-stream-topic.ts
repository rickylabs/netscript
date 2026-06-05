import type { StateSchema, StreamStateDefinition } from '../domain/stream-schema.ts';

/** Diagnostic report returned by {@link inspectStreamTopic}. */
export interface StreamTopicInspectionReport {
  /** Package identifier that produced the report. */
  readonly package: '@netscript/plugin-streams-core';
  /** Human-readable inspected target. */
  readonly target: string;
  /** Short diagnostic summary. */
  readonly summary: string;
  /** JSON-stable diagnostic details. */
  readonly details: {
    readonly collections: readonly string[];
    readonly streamPath?: string;
    readonly producerId?: string;
  };
}

/** Input accepted by {@link inspectStreamTopic}. */
export interface StreamTopicInspectionInput<TDef extends StreamStateDefinition> {
  /** Human-readable target name. */
  readonly target?: string;
  /** Schema to inspect. */
  readonly schema: StateSchema<TDef>;
  /** Optional stream path associated with the schema. */
  readonly streamPath?: string;
  /** Optional producer identity associated with the schema. */
  readonly producerId?: string;
}

/**
 * Inspect a stream schema and optional producer metadata.
 *
 * @param input - Schema and optional producer metadata to inspect.
 * @returns A JSON-stable diagnostic report.
 *
 * @example
 * ```ts
 * import { inspectStreamTopic } from "@netscript/plugin-streams-core";
 *
 * const report = inspectStreamTopic({ target: "empty", schema: {} });
 * console.log(report.summary);
 * ```
 */
export function inspectStreamTopic<TDef extends StreamStateDefinition>(
  input: StreamTopicInspectionInput<TDef>,
): StreamTopicInspectionReport {
  const collections = Object.keys(input.schema).sort();
  const target = input.target ?? input.streamPath ?? 'stream-schema';

  return {
    package: '@netscript/plugin-streams-core',
    target,
    summary: `${target}: ${collections.length} stream collection(s)`,
    details: {
      collections,
      streamPath: input.streamPath,
      producerId: input.producerId,
    },
  };
}
