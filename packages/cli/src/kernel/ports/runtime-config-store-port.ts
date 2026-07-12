/** Runtime override topics managed by the CLI. */
export const RUNTIME_OVERRIDE_TOPICS = [
  'jobs',
  'sagas',
  'triggers',
  'features',
  'tasks',
] as const;

/** Runtime override topic. */
export type RuntimeOverrideTopic = typeof RUNTIME_OVERRIDE_TOPICS[number];

/** JSON pointer describing active topic versions. */
export interface RuntimeOverridePointer {
  readonly version?: string;
  readonly jobs?: string;
  readonly sagas?: string;
  readonly triggers?: string;
  readonly features?: string;
  readonly tasks?: string;
}

/** Versioned runtime override persistence seam. */
export interface RuntimeConfigStorePort {
  /** Read the active pointer, returning an empty pointer when absent. */
  readPointer(): Promise<RuntimeOverridePointer>;
  /** Atomically replace the active pointer. */
  activate(pointer: RuntimeOverridePointer): Promise<void>;
  /** Read one versioned topic payload. */
  read(topic: RuntimeOverrideTopic, version: string): Promise<unknown>;
  /** Write one versioned topic payload. */
  write(topic: RuntimeOverrideTopic, version: string, value: unknown): Promise<void>;
  /** List available topic versions. */
  versions(topic: RuntimeOverrideTopic): Promise<readonly string[]>;
}
