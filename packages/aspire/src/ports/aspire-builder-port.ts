import type {
  AspireResource,
  CacheSpec,
  ContainerSpec,
  DatabaseSpec,
  DenoBackgroundSpec,
  DenoServiceSpec,
} from '../domain/mod.ts';

/** Port implemented by adapters that emit Aspire AppHost resources. */
export interface AspireBuilder {
  /** Add a Deno service resource. */
  addDenoService(name: string, spec: DenoServiceSpec): AspireResource;
  /** Add a Deno background process resource. */
  addDenoBackground(name: string, spec: DenoBackgroundSpec): AspireResource;
  /** Add a generic container resource. */
  addContainer(name: string, spec: ContainerSpec): AspireResource;
  /** Add a PostgreSQL database resource. */
  addPostgresDatabase(name: string, spec: DatabaseSpec): AspireResource;
  /** Add a MySQL database resource. */
  addMysqlDatabase(name: string, spec: DatabaseSpec): AspireResource;
  /** Add a SQL Server database resource. */
  addMssqlDatabase(name: string, spec: DatabaseSpec): AspireResource;
  /** Add a Redis cache resource. */
  addRedisCache(name: string, spec: CacheSpec): AspireResource;
  /** Add a Garnet cache resource. */
  addGarnetCache(name: string, spec: CacheSpec): AspireResource;
  /** Record a non-blocking reference from one resource to another. */
  reference(from: string, to: string): void;
  /** Record a blocking startup dependency from one resource to another. */
  waitFor(from: string, to: string): void;
}
