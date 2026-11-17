/**
 * Catchable failures from KV operations and watch streams.
 *
 * @module
 */

/** Base class for failures reported by the KV adapters. */
export class KvError extends Error {
  /**
   * Create a KV failure while retaining its original cause.
   *
   * @param message - Description of the failed operation.
   * @param options - Original cause and standard error options.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The backend could not connect or a watch exhausted its recovery budget. */
export class KvConnectionError extends KvError {}

/** An operation or active watch failed because its adapter was closed. */
export class KvClosedError extends KvError {}
