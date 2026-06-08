import type { ExtractedContribution } from './ports/extractor-port.ts';
import type { WalkedFile } from './ports/walker-port.ts';

/** Source graph snapshot produced by discovery. */
export interface SourceGraph {
  /** Source files included in the snapshot. */
  readonly files: readonly WalkedFile[];
  /** Contributions extracted from the source files. */
  readonly contributions: readonly ExtractedContribution[];
}

/** Create a source graph snapshot from walked files and extracted contributions. */
export function createSourceGraph(
  files: readonly WalkedFile[],
  contributions: readonly ExtractedContribution[],
): SourceGraph {
  return { files, contributions };
}
