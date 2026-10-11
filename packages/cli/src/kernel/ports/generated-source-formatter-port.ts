import type { ProcessResult } from './process-port.ts';

/** Formatting policy for an exact set of generated files. */
export type GeneratedFileFormatPolicy = 'generated' | 'project';

/** Rendered source paired with the target dialect. */
export interface GeneratedSourceContent {
  readonly targetPath: string;
  readonly content: string;
}

/** Internal formatting boundary for generated source code. */
export interface GeneratedSourceFormatterPort {
  /** Canonicalize rendered content for the dialect implied by its target path. */
  formatContent(targetPath: string, content: string): Promise<string>;

  /** Canonicalize a bounded source batch, preserving input order. */
  formatContents(files: readonly GeneratedSourceContent[]): Promise<readonly string[]>;

  /** Format an exact set of generated files under the selected policy. */
  formatFiles(
    projectRoot: string,
    files: readonly string[],
    policy: GeneratedFileFormatPolicy,
  ): Promise<ProcessResult>;
}
