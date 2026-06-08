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

/** Error thrown when a plugin name is registered more than once. */
export class DuplicatePluginError extends PluginError {
  /** Create a duplicate-plugin error for the conflicting name. */
  constructor(name: string) {
    super(`Plugin "${name}" is already registered.`);
    this.name = 'DuplicatePluginError';
  }
}
