import type { CheckedLanguage } from './snippet-extractor.ts';

/** Stable ownership for one published JSDoc example tag. */
export interface JsdocExampleOwner {
  memberName: string;
  memberRoot: string;
  sourcePath: string;
  kind: 'module' | 'symbol';
  symbol?: string;
  publicSpecifier?: string;
  declarationKind?: 'value' | 'type' | 'class';
}

/** One fenced block extracted from a structured Deno JSDoc example tag. */
export interface JsdocExampleBlock {
  owner: JsdocExampleOwner;
  exampleOrdinal: number;
  fenceOrdinal: number;
  openingLine: number;
  codeStartLine: number;
  language: string;
  checkedLanguage?: CheckedLanguage;
  compilationExtension?: 'ts' | 'tsx';
  exemptionReason?: string;
  body: string;
}

/** Policy classification for a published example block or tag. */
export type JsdocExampleDisposition =
  | 'checked'
  | 'exempt'
  | 'nonTypeScript'
  | 'unfenced'
  | 'malformed';

/** One source-attributed policy result. */
export interface JsdocExampleFinding {
  disposition: JsdocExampleDisposition;
  owner: JsdocExampleOwner;
  exampleOrdinal: number;
  fenceOrdinal?: number;
  reason?: string;
}

/** Stable corpus totals printed by the JSDoc example gate. */
export interface JsdocExampleCensus {
  members: number;
  files: number;
  examples: number;
  candidates: number;
  checked: number;
  exempt: number;
  nonTypeScript: number;
  unfenced: number;
  malformed: number;
  failures: number;
}

/** Reviewed corpus ratchet; failure allowances are intentionally absent. */
export interface JsdocExampleFloor {
  minimumExamples: number;
  minimumCandidates: number;
  minimumChecked: number;
  maximumExempt: number;
}

/** Extracted corpus passed from policy to the compile-only runner. */
export interface JsdocExampleAnalysis {
  blocks: JsdocExampleBlock[];
  findings: JsdocExampleFinding[];
  exemptions: JsdocExampleBlock[];
  census: JsdocExampleCensus;
}

/** Exact public binding for a documented declaration. */
export interface PublicSymbolBinding {
  symbol: string;
  declarationPath: string;
  declarationKind: 'value' | 'type' | 'class';
  publicSpecifier: string;
}

/** Classified compile failure used by the committed RED census. */
export type JsdocFailureClass =
  | 'badSpecifier'
  | 'typeError'
  | 'unboundName'
  | 'unfenced'
  | 'malformed';

/** Per-class failure totals captured before corpus repairs. */
export type JsdocFailureCensus = Record<JsdocFailureClass, number>;

/** Body diagnostic deferred by the narrowed gate but retained for a non-growing follow-up list. */
export interface JsdocDeferredExample {
  failureClass: 'unboundName' | 'typeError';
  owner: JsdocExampleOwner;
  exampleOrdinal: number;
  fenceOrdinal: number;
  tsCodes: number[];
}

/** Result of one non-executing corpus compilation. */
export interface JsdocExampleCompilationResult {
  code: number;
  diagnostics: string;
  failureCensus: JsdocFailureCensus;
  enforcedFailureCount: number;
  deferredExamples: JsdocDeferredExample[];
  rootLockUnchanged: boolean;
  temporaryLockRewritten: boolean;
  denoCheckSpawned: boolean;
}
