import type { ExecutionPlatform } from '../domain/platform.ts';

/** Supplies the execution platform at the suite composition boundary. */
export interface PlatformPort {
  /** Return the platform executing the current suite. */
  current(): ExecutionPlatform;
}
