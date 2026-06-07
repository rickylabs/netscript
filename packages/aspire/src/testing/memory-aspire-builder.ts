import type {
  AspireResource,
  CacheSpec,
  ContainerSpec,
  DatabaseSpec,
  DenoBackgroundSpec,
  DenoServiceSpec,
} from '../domain/mod.ts';
import type { AspireBuilder } from '../ports/mod.ts';

/** Recorded relationship between two in-memory Aspire resources. */
export interface MemoryAspireReference {
  /** Source resource name. */
  readonly from: string;
  /** Target resource name. */
  readonly to: string;
  /** Whether the source waits for the target before starting. */
  readonly waitFor: boolean;
}

/** In-memory Aspire builder used by tests and examples. */
export class MemoryAspireBuilder implements AspireBuilder {
  /** Resources added to the in-memory builder. */
  readonly resources: AspireResource[] = [];
  /** Resource references recorded by the in-memory builder. */
  readonly references: MemoryAspireReference[] = [];

  /** Add a Deno service resource to the in-memory graph. */
  addDenoService(name: string, spec: DenoServiceSpec): AspireResource {
    return this.pushResource(name, 'deno-service', spec.port, spec);
  }

  /** Add a Deno background process resource to the in-memory graph. */
  addDenoBackground(name: string, spec: DenoBackgroundSpec): AspireResource {
    return this.pushResource(name, 'deno-background', undefined, spec);
  }

  /** Add a container resource to the in-memory graph. */
  addContainer(name: string, spec: ContainerSpec): AspireResource {
    return this.pushResource(name, 'container', spec.port, spec);
  }

  /** Add a PostgreSQL database resource to the in-memory graph. */
  addPostgresDatabase(name: string, spec: DatabaseSpec): AspireResource {
    return this.pushResource(name, 'database', spec.port, spec);
  }

  /** Add a MySQL database resource to the in-memory graph. */
  addMysqlDatabase(name: string, spec: DatabaseSpec): AspireResource {
    return this.pushResource(name, 'database', spec.port, spec);
  }

  /** Add a SQL Server database resource to the in-memory graph. */
  addMssqlDatabase(name: string, spec: DatabaseSpec): AspireResource {
    return this.pushResource(name, 'database', spec.port, spec);
  }

  /** Add a Redis cache resource to the in-memory graph. */
  addRedisCache(name: string, spec: CacheSpec): AspireResource {
    return this.pushResource(name, 'cache', spec.port, spec);
  }

  /** Add a Garnet cache resource to the in-memory graph. */
  addGarnetCache(name: string, spec: CacheSpec): AspireResource {
    return this.pushResource(name, 'cache', spec.port, spec);
  }

  /** Record a non-blocking resource reference. */
  reference(from: string, to: string): void {
    this.references.push({ from, to, waitFor: false });
  }

  /** Record a blocking resource reference. */
  waitFor(from: string, to: string): void {
    this.references.push({ from, to, waitFor: true });
  }

  /** Add a resource record to the in-memory graph. */
  protected pushResource(
    name: string,
    kind: AspireResource['kind'],
    port: number | undefined,
    spec: unknown,
  ): AspireResource {
    const resource: AspireResource = { name, kind, port, metadata: { spec } };
    this.resources.push(resource);
    return resource;
  }
}
