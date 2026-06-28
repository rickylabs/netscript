import { DenoFileSystemAdapter } from '../adapters/mod.ts';
import type { FileSystemPort } from '../ports/mod.ts';
import type {
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '../protocol/mod.ts';
import type { PluginScaffolder } from './plugin-scaffolder.ts';

/** Constructor shape accepted by {@link toEntrypoint}. */
export interface PluginScaffolderConstructor {
  /** Create a plugin scaffolder with an explicit filesystem port. */
  new (fileSystem: FileSystemPort): PluginScaffolder;
}

/**
 * Convert a scaffolder class into the protocol entrypoint consumed by installers.
 *
 * @param constructor - Scaffolder constructor that accepts the entrypoint filesystem adapter.
 * @returns Protocol-compatible scaffold entrypoint.
 */
export function toEntrypoint(
  constructor: PluginScaffolderConstructor,
): PluginScaffoldEntrypoint {
  return (context: ScaffolderContext): Promise<ScaffoldResult> =>
    new constructor(new DenoFileSystemAdapter()).scaffold(context);
}
