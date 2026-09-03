import { extname } from '@std/path';
import type {
  GeneratedFileFormatPolicy,
  GeneratedSourceFormatterPort,
} from '../../../ports/generated-source-formatter-port.ts';
import type { ProcessPort, ProcessResult } from '../../../ports/process-port.ts';

const GENERATED_FORMAT_ARGS = [
  '--no-config',
  '--line-width',
  '100',
  '--single-quote',
] as const;

const SUPPORTED_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'mts',
  'mjs',
  'cts',
  'cjs',
  'md',
  'json',
  'jsonc',
  'css',
  'scss',
  'less',
  'html',
  'xml',
  'svg',
  'svelte',
  'vue',
  'astro',
  'yml',
  'yaml',
  'ipynb',
  'sql',
  'vto',
  'njk',
]);

/** Deno-backed canonicalizer for generated source and exact file sets. */
export class DenoGeneratedSourceFormatter implements GeneratedSourceFormatterPort {
  /** Create a formatter over the shared process boundary. */
  constructor(private readonly process: ProcessPort) {}

  /** Canonicalize rendered content before its write decision. */
  async formatContent(targetPath: string, content: string): Promise<string> {
    const extension = extname(targetPath).slice(1).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new Error(
        `Unable to format generated source for ${targetPath}: unsupported or missing target extension.`,
      );
    }
    if (content === '') return '';

    const result = await this.process.exec(
      'deno',
      ['fmt', ...GENERATED_FORMAT_ARGS, '--ext', extension, '-'],
      { stdin: content },
    );
    if (result.code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`;
      throw new Error(`Unable to format generated source for ${targetPath}: ${detail}`);
    }
    return result.stdout;
  }

  /** Format exact generated paths using either generated or project policy. */
  formatFiles(
    projectRoot: string,
    files: readonly string[],
    policy: GeneratedFileFormatPolicy,
  ): Promise<ProcessResult> {
    const policyArgs = policy === 'generated' ? GENERATED_FORMAT_ARGS : [];
    return this.process.exec(
      'deno',
      ['fmt', ...policyArgs, ...files],
      { cwd: projectRoot },
    );
  }
}
