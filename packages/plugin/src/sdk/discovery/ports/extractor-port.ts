import type { WalkedFile } from './walker-port.ts';

/** Extracted contribution candidate from source. */
export interface ExtractedContribution {
  /** Source file that declared the contribution. */
  readonly file: string;
  /** Exported symbol name for the contribution. */
  readonly symbol: string;
  /** Contribution axis inferred from the declaration. */
  readonly axis: string;
}

/** Source-level factory call pattern that emits contributions for one axis. */
export interface ContributionBuilderPattern {
  /** Direct-call factory identifier to discover in exported declarations. */
  readonly callee: string;
  /** Registry axis assigned to contributions produced by the factory. */
  readonly axis: string;
}

/** Port for extracting plugin contributions from walked files. */
export interface ExtractorPort {
  /** Extract contribution candidates from walked files. */
  extract(files: readonly WalkedFile[]): Promise<readonly ExtractedContribution[]>;
}
