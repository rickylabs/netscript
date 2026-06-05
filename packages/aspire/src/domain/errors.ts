/** Base error for Aspire package failures. */
export class AspireError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AspireError';
  }
}

/** Error raised when a contribution is registered more than once. */
export class DuplicateContributionError extends AspireError {
  constructor(readonly pluginName: string) {
    super(`Aspire contribution already registered for ${pluginName}`);
    this.name = 'DuplicateContributionError';
  }
}
