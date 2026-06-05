import { STREAMS_SPAN_NAMES, STREAMS_TELEMETRY_ATTRIBUTES } from './attributes.ts';

/** Minimal instrumentation contract understood by NetScript telemetry hosts. */
export interface StreamsInstrumentationRegistration {
  /** Stable instrumentation name. */
  readonly name: string;
  /** Register instrumentation hooks with the host telemetry context. */
  setup(context: unknown): void;
}

/**
 * Telemetry registration for stream publish, consume, and subscribe spans.
 *
 * @example
 * ```ts
 * import { streamsInstrumentation } from "@netscript/plugin-streams-core/telemetry";
 *
 * console.log(streamsInstrumentation.name);
 * ```
 */
export const streamsInstrumentation: StreamsInstrumentationRegistration = {
  name: 'netscript.streams',
  setup: (_context) => {
    void STREAMS_SPAN_NAMES;
    void STREAMS_TELEMETRY_ATTRIBUTES;
  },
};
