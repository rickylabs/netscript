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
  addDenoService(name: string, spec: DenoServiceSpec): AspireResource;
  addDenoBackground(name: string, spec: DenoBackgroundSpec): AspireResource;
  addContainer(name: string, spec: ContainerSpec): AspireResource;
  addPostgresDatabase(name: string, spec: DatabaseSpec): AspireResource;
  addMysqlDatabase(name: string, spec: DatabaseSpec): AspireResource;
  addMssqlDatabase(name: string, spec: DatabaseSpec): AspireResource;
  addRedisCache(name: string, spec: CacheSpec): AspireResource;
  addGarnetCache(name: string, spec: CacheSpec): AspireResource;
  reference(from: string, to: string): void;
  waitFor(from: string, to: string): void;
}
