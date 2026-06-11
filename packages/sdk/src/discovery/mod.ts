/**
 * Service discovery implementation barrel.
 *
 * @module
 */

export {
  type BrowserEnvironment,
  createBrowserServiceEnvKey,
  createBrowserServiceShortEnvKey,
  getBrowserServiceUrl,
  getBrowserServiceUrlFromEnv,
} from './browser-env.ts';
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
  createServerServiceEnvKey,
  getAllServices,
  getServiceInfo,
  getServiceUrl,
  isServiceAvailable,
  resolveServiceUrlFromSources,
  type ServerEnvironment,
  type ServiceInfo,
  type ServiceProtocol,
  type ServiceUrlEnvironmentSources,
} from './service-url.ts';
