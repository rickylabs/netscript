/**
 * Internal error helpers for the KV package.
 */

export class KvError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class KvConnectionError extends KvError {}

export class KvClosedError extends KvError {}
