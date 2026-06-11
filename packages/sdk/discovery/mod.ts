/**
 * `@netscript/sdk/discovery` Aspire environment discovery APIs.
 *
 * This subpath resolves service URLs from browser VITE keys and server-side
 * Aspire `services__*` variables. It also exposes helpers for KV, PostgreSQL,
 * SQL Server, and MySQL connection settings managed through Aspire
 * environment variables.
 *
 * The implementation keeps browser key lookup, service URL lookup, and data
 * connection lookup in separate modules so frontend bundles can depend on the
 * URL surface without pulling in unrelated database helpers.
 *
 * @module
 */

export {
  getAllServices,
  getKvConnection,
  getMssqlConnection,
  getMssqlUri,
  getMysqlConnection,
  getMysqlUri,
  getPostgresConnection,
  getPostgresUri,
  getServiceInfo,
  getServiceUrl,
  isServiceAvailable,
  type MssqlConnectionInfo,
  type MysqlConnectionInfo,
  type PostgresConnectionInfo,
  type ServiceInfo,
  type ServiceProtocol,
} from '../src/discovery/mod.ts';
