import type { ExtractedContribution } from './extractor-port.ts';

/** Output emitted by the registry emitter. */
export interface RegistryEmission {
  /** Generated file path. */
  readonly path: string;
  /** Generated file text. */
  readonly text: string;
}

/** Port for emitting generated plugin registry files. */
export interface EmitterPort {
  /** Emit registry files for extracted contributions. */
  emit(contributions: readonly ExtractedContribution[]): Promise<readonly RegistryEmission[]>;
}
