import type { ExtractedContribution } from './extractor-port.ts';

/** Output emitted by the registry emitter. */
export interface RegistryEmission {
  readonly path: string;
  readonly text: string;
}

/** Port for emitting generated plugin registry files. */
export interface EmitterPort {
  emit(contributions: readonly ExtractedContribution[]): Promise<readonly RegistryEmission[]>;
}
