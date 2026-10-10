/** Why a PostgreSQL connection string cannot be translated faithfully. */
export type PostgresConnectionStringErrorReason =
  | 'unsupported-key'
  | 'unsupported-value'
  | 'invalid-format';

/**
 * Refuses connection settings that cannot be represented without loss.
 * Messages omit values and connection strings to keep credentials private.
 *
 * @example
 * ```ts
 * import { PostgresConnectionStringError } from '@netscript/database/connection-strings/postgres';
 * const error = new PostgresConnectionStringError('unsupported-key', 'root certificate');
 * console.log(error.reason, error.key);
 * ```
 */
export class PostgresConnectionStringError extends Error {
  /** Machine-readable refusal reason. */
  readonly reason: PostgresConnectionStringErrorReason;
  /** Lowercase option key, when the refusal concerns a specific option. */
  readonly key?: string;

  /** Construct a refusal without including the connection string or option value. */
  constructor(reason: PostgresConnectionStringErrorReason, key?: string) {
    super(`Cannot normalize PostgreSQL connection string: ${reason}.`);
    this.name = 'PostgresConnectionStringError';
    this.reason = reason;
    this.key = key;
  }
}
