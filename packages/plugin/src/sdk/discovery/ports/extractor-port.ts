import type { WalkedFile } from './walker-port.ts';

/** Extracted contribution candidate from source. */
export interface ExtractedContribution {
  readonly file: string;
  readonly symbol: string;
  readonly axis: string;
}

/** Port for extracting plugin contributions from walked files. */
export interface ExtractorPort {
  extract(files: readonly WalkedFile[]): Promise<readonly ExtractedContribution[]>;
}
