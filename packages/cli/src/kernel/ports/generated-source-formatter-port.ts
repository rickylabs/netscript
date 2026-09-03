import type { ProcessResult } from './process-port.ts';

/** Formatting policy for an exact set of generated files. */
export type GeneratedFileFormatPolicy = 'generated' | 'project';

/** Internal formatting boundary for generated source code. */
export interface GeneratedSourceFormatterPort {
  /** Canonicalize rendered content for the dialect implied by its target path. */
  formatContent(targetPath: string, content: string): Promise<string>;

  /** Format an exact set of generated files under the selected policy. */
  formatFiles(
    projectRoot: string,
    files: readonly string[],
    policy: GeneratedFileFormatPolicy,
  ): Promise<ProcessResult>;
}
