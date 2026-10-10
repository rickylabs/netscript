/**
 * Dependency-free PostgreSQL connection-string normalization.
 *
 * @module
 */
export { normalizePostgresConnectionString } from '../adapters/postgres-connection-string.ts';
export {
  PostgresConnectionStringError,
  type PostgresConnectionStringErrorReason,
} from '../adapters/postgres-connection-string-error.ts';
