import type { NetScriptConfig } from '../../types.ts';

/** JSON-stable diagnostic report returned by config inspectors. */
export interface InspectionReport {
  /** Package identifier inspected by this report. */
  readonly package: '@netscript/config';
  /** Human-readable target name or path supplied to the inspector. */
  readonly target: string;
  /** Short diagnostic summary suitable for CLI output. */
  readonly summary: string;
  /** JSON-stable detail payload for machine readers. */
  readonly details: Record<string, unknown>;
}

/**
 * Inspect a config target and return a JSON-stable diagnostic report.
 *
 * @param target - A config object or path-like label to describe.
 * @returns A diagnostic report suitable for CLI rendering.
 *
 * @example
 * ```ts
 * import { inspectConfig } from "@netscript/config";
 *
 * const report = inspectConfig({ name: "app", version: "1.0.0" });
 * const summary = report.summary;
 * ```
 */
export function inspectConfig(target: Partial<NetScriptConfig> | string): InspectionReport {
  if (typeof target === 'string') {
    return {
      package: '@netscript/config',
      target,
      summary: 'Config path inspection target',
      details: { kind: 'path' },
    };
  }

  return {
    package: '@netscript/config',
    target: target.name ?? 'inline-config',
    summary: 'Inline NetScript config inspection target',
    details: {
      kind: 'object',
      version: target.version,
      services: Object.keys(target.services ?? {}).length,
      apps: Object.keys(target.apps ?? {}).length,
      databases: target.databases?.config.length ?? 0,
    },
  };
}
