/** Base error for NetScript stream contract failures. */
export class StreamError extends Error {
  /** Create a stream error with a stable error name. */
  constructor(message: string) {
    super(message);
    this.name = 'StreamError';
  }
}

/** Error thrown when a stream schema cannot be inspected or used. */
export class StreamSchemaError extends StreamError {
  /** Create a stream schema error with a stable error name. */
  constructor(message: string) {
    super(message);
    this.name = 'StreamSchemaError';
  }
}
