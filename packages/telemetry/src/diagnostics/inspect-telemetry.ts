import type { InstrumentationEntry, InstrumentationRegistry } from '../application/registry/mod.ts';

/** JSON-stable diagnostic report returned by telemetry inspectors. */
export interface InspectionReport {
  /** Package identifier inspected by this report. */
  readonly package: '@netscript/telemetry';
  /** Human-readable target name or path supplied to the inspector. */
  readonly target: string;
  /** Short diagnostic summary suitable for CLI output. */
  readonly summary: string;
  /** JSON-stable detail payload for machine readers. */
  readonly details: Record<string, unknown>;
}

/**
 * Inspect a telemetry target and return a JSON-stable diagnostic report.
 *
 * @param target - Registry, config-like object, or path-like label to inspect.
 * @returns A diagnostic report suitable for CLI rendering.
 */
export function inspectTelemetry(
  target: string | InstrumentationRegistry | Record<string, unknown>,
): InspectionReport {
  if (typeof target === 'string') {
    return {
      package: '@netscript/telemetry',
      target,
      summary: 'Telemetry path inspection target',
      details: { kind: 'path' },
    };
  }

  if ('list' in target && typeof target.list === 'function') {
    const entries: readonly InstrumentationEntry[] = target.list();
    return {
      package: '@netscript/telemetry',
      target: 'instrumentation-registry',
      summary: 'Telemetry instrumentation registry inspection target',
      details: {
        kind: 'registry',
        registrations: entries.length,
        names: entries.map((entry: InstrumentationEntry) => entry.name),
      },
    };
  }

  return {
    package: '@netscript/telemetry',
    target: 'telemetry-config',
    summary: 'Telemetry config inspection target',
    details: {
      kind: 'object',
      keys: Object.keys(target),
    },
  };
}
