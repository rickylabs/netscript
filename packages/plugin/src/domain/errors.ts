import type { PluginCompositionDiagnostic } from './plugin-composition.ts';

/** Base error for plugin package failures. */
export class PluginError extends Error {
  /** Create a plugin package error. */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PluginError';
  }
}

/** Error thrown when a plugin definition is invalid. */
export class PluginValidationError extends PluginError {
  /** Create a validation error with optional issue details. */
  constructor(message: string, readonly issues: readonly string[] = []) {
    super(message);
    this.name = 'PluginValidationError';
  }
}

/**
 * Error thrown when a set of plugin manifests cannot be composed into one root host.
 *
 * @example
 * ```ts
 * import { PluginCompositionError } from '@netscript/plugin';
 *
 * const error = new PluginCompositionError([{
 *   code: 'duplicate-plugin',
 *   plugin: '@example/plugin',
 *   message: 'Plugin "@example/plugin" is declared more than once.',
 * }]);
 * console.log(error.diagnostics[0]?.code); // 'duplicate-plugin'
 * ```
 */
export class PluginCompositionError extends PluginValidationError {
  /** Structured diagnostics, in manifest order. */
  readonly diagnostics: readonly PluginCompositionDiagnostic[];

  /** Create a composition error from the diagnostics that rejected the composition. */
  constructor(diagnostics: readonly PluginCompositionDiagnostic[]) {
    const issues = diagnostics.map((diagnostic) => diagnostic.message);
    super(`Invalid plugin composition:\n- ${issues.join('\n- ')}`, issues);
    this.name = 'PluginCompositionError';
    this.diagnostics = diagnostics;
  }
}

/** Error thrown when a plugin name is registered more than once. */
export class DuplicatePluginError extends PluginError {
  /** Create a duplicate-plugin error for the conflicting name. */
  constructor(name: string) {
    super(`Plugin "${name}" is already registered.`);
    this.name = 'DuplicatePluginError';
  }
}
