/** Base error for Aspire package failures. */
export class AspireError extends Error {
  /** Creates an Aspire package error with an optional cause. */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AspireError';
  }
}

/** Error raised when a contribution is registered more than once. */
export class DuplicateContributionError extends AspireError {
  /** Creates an error for a duplicate plugin contribution. */
  constructor(readonly pluginName: string) {
    super(`Aspire contribution already registered for ${pluginName}`);
    this.name = 'DuplicateContributionError';
  }
}
