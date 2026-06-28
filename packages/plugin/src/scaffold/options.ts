/** Pattern a scaffold plugin name must match: kebab-case starting with a lowercase letter. */
const PLUGIN_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

/** Option key carrying the userland plugin name in a scaffolder context. */
const PLUGIN_NAME_OPTION = 'pluginName';

/**
 * Error thrown when a scaffolder is invoked without a valid kebab-case `pluginName` option.
 *
 * Centralizing this error type lets every plugin surface the same failure shape instead of each
 * plugin throwing an ad-hoc `Error` with bespoke wording.
 */
export class InvalidPluginNameError extends Error {
  /** The raw, rejected option value (for diagnostics). */
  readonly received: unknown;

  /**
   * Construct an error describing a rejected plugin-name option.
   *
   * @param received The raw `options.pluginName` value that failed validation.
   */
  constructor(received: unknown) {
    super(
      'Scaffolder requires a kebab-case options.pluginName matching /^[a-z][a-z0-9-]*$/.',
    );
    this.name = 'InvalidPluginNameError';
    this.received = received;
  }
}

/** Minimal shape accepted by {@linkcode readScaffoldPluginName}: a record of scaffold options. */
export interface ScaffoldPluginNameSource {
  /** Plugin-specific scaffold options supplied by the installer. */
  readonly options: Readonly<Record<string, unknown>>;
}

/**
 * Read and validate the userland plugin name from a scaffolder's options.
 *
 * This is the single, shared replacement for the per-plugin `readPluginName` helpers that were
 * previously duplicated across every first-party plugin. It accepts either a full scaffolder
 * context (anything carrying an `options` record) or the options record itself.
 *
 * @param source A scaffolder context with an `options` record, or the options record directly.
 * @returns The validated kebab-case plugin name.
 * @throws {InvalidPluginNameError} When `options.pluginName` is absent or not kebab-case.
 * @example
 * ```ts
 * import { readScaffoldPluginName } from '@netscript/plugin/scaffold';
 *
 * const pluginName = readScaffoldPluginName(context); // throws InvalidPluginNameError if invalid
 * ```
 */
export function readScaffoldPluginName(
  source: ScaffoldPluginNameSource | Readonly<Record<string, unknown>>,
): string {
  const options = extractOptions(source);
  const pluginName = options[PLUGIN_NAME_OPTION];
  if (typeof pluginName !== 'string' || !PLUGIN_NAME_PATTERN.test(pluginName)) {
    throw new InvalidPluginNameError(pluginName);
  }
  return pluginName;
}

/** Resolve the options record from either a context-like source or a raw options record. */
function extractOptions(
  source: ScaffoldPluginNameSource | Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const nested = isRecord(source) ? source['options'] : undefined;
  if (isRecord(nested)) {
    return nested;
  }
  return isRecord(source) ? source : {};
}

/** Narrow an unknown value to a plain object record. */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
