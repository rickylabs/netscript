import type { ExtractedContribution } from './ports/extractor-port.ts';
import type { WalkedFile } from './ports/walker-port.ts';

/** Source graph snapshot produced by discovery. */
export interface SourceGraph {
  readonly files: readonly WalkedFile[];
  readonly contributions: readonly ExtractedContribution[];
}

/** Create a source graph snapshot from walked files and extracted contributions. */
export function createSourceGraph(
  files: readonly WalkedFile[],
  contributions: readonly ExtractedContribution[],
): SourceGraph {
  return { files, contributions };
}
