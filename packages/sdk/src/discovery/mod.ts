/**
 * `@netscript/sdk/discovery` Aspire environment discovery APIs.
 *
 * This subpath resolves service URLs from browser VITE keys and server-side
 * Aspire `services__*` variables. It also exposes helpers for KV, PostgreSQL,
 * SQL Server, and MySQL connection settings managed through Aspire
 * environment variables.
 *
 * The implementation keeps browser key lookup, service URL lookup, and data
 * connection lookup in separate modules (`browser-env.ts`, `kv-connection.ts`,
 * `service-url.ts`) so frontend bundles can depend on the URL surface without
 * pulling in unrelated database helpers. This barrel curates the public subset;
 * internal env-key builders stay module-private.
 *
 * @module
 */

export {
  getKvConnection,
  getMssqlConnection,
  getMssqlUri,
  getMysqlConnection,
  getMysqlUri,
  getPostgresConnection,
  getPostgresUri,
  type MssqlConnectionInfo,
  type MysqlConnectionInfo,
  type PostgresConnectionInfo,
} from './kv-connection.ts';
export {
  getAllServices,
  getServiceInfo,
  getServiceUrl,
  isServiceAvailable,
  type ServiceInfo,
  type ServiceProtocol,
} from './service-url.ts';
