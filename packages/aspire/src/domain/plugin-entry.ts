/** Deno service resource spec consumed by AspireBuilder. */
export interface DenoServiceSpec {
  /** Service working directory. */
  readonly workdir: string;
  /** Service entrypoint path. */
  readonly entrypoint: string;
  /** TCP port exposed by the service. */
  readonly port: number;
  /** Deno permission flags. */
  readonly permissions: readonly string[];
  /** Environment variables supplied to the service. */
  readonly env?: Record<string, string>;
}

/** Deno background process spec consumed by AspireBuilder. */
export interface DenoBackgroundSpec {
  /** Background process working directory. */
  readonly workdir: string;
  /** Background process entrypoint path. */
  readonly entrypoint: string;
  /** Deno permission flags. */
  readonly permissions: readonly string[];
  /** Environment variable that controls concurrency. */
  readonly concurrencyEnvVar?: string;
  /** Whether Deno watch mode is enabled. */
  readonly watchMode?: boolean;
}

/** Container resource spec consumed by AspireBuilder. */
export interface ContainerSpec {
  /** Container image name. */
  readonly image: string;
  /** Optional container image tag. */
  readonly tag?: string;
  /** TCP port exposed by the container. */
  readonly port?: number;
  /** Environment variables supplied to the container. */
  readonly env?: Record<string, string>;
}

/** Database resource spec consumed by AspireBuilder. */
export interface DatabaseSpec {
  /** Database name. */
  readonly databaseName?: string;
  /** TCP port exposed by the database. */
  readonly port?: number;
  /** Whether the database uses persistent storage. */
  readonly persistent?: boolean;
}

/** Cache resource spec consumed by AspireBuilder. */
export interface CacheSpec {
  /** TCP port exposed by the cache. */
  readonly port?: number;
  /** Whether the cache uses persistent storage. */
  readonly persistent?: boolean;
}
