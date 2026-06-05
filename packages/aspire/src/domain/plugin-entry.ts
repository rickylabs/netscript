/** Deno service resource spec consumed by AspireBuilder. */
export interface DenoServiceSpec {
  readonly workdir: string;
  readonly entrypoint: string;
  readonly port: number;
  readonly permissions: readonly string[];
  readonly env?: Record<string, string>;
}

/** Deno background process spec consumed by AspireBuilder. */
export interface DenoBackgroundSpec {
  readonly workdir: string;
  readonly entrypoint: string;
  readonly permissions: readonly string[];
  readonly concurrencyEnvVar?: string;
  readonly watchMode?: boolean;
}

/** Container resource spec consumed by AspireBuilder. */
export interface ContainerSpec {
  readonly image: string;
  readonly tag?: string;
  readonly port?: number;
  readonly env?: Record<string, string>;
}

/** Database resource spec consumed by AspireBuilder. */
export interface DatabaseSpec {
  readonly databaseName?: string;
  readonly port?: number;
  readonly persistent?: boolean;
}

/** Cache resource spec consumed by AspireBuilder. */
export interface CacheSpec {
  readonly port?: number;
  readonly persistent?: boolean;
}
