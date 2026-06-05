/**
 * Service-discovery APIs for the NetScript SDK.
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
} from './service-discovery.ts';
