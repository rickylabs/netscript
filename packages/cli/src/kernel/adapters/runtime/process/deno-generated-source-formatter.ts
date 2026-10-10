import { extname, join } from '@std/path';
import type {
  GeneratedFileFormatPolicy,
  GeneratedSourceContent,
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

  /** Format a source batch in one process without touching consumer paths. */
  async formatContents(files: readonly GeneratedSourceContent[]): Promise<readonly string[]> {
    if (files.length > 256 || files.some((file) => file.content.length > 16 * 1024 * 1024)) {
      throw new Error('Generated source batch exceeds its bounded capacity.');
    }
    for (const file of files) {
      if (!SUPPORTED_EXTENSIONS.has(extname(file.targetPath).slice(1).toLowerCase())) {
        throw new Error(
          `Unable to format generated source for ${file.targetPath}: unsupported or missing target extension.`,
        );
      }
    }
    if (files.length === 0) return [];
    const stagingRoot = await Deno.makeTempDir();
    try {
      const paths = files.map((file, index) =>
        join(stagingRoot, `${index}${extname(file.targetPath).toLowerCase()}`)
      );
      for (let index = 0; index < files.length; index++) {
        await Deno.writeTextFile(paths[index], files[index].content);
      }
      const result = await this.formatFiles(stagingRoot, paths, 'generated');
      if (result.code !== 0) {
        const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`;
        throw new Error(`Unable to format generated source batch: ${detail}`);
      }
      const contents: string[] = [];
      for (const path of paths) contents.push(await Deno.readTextFile(path));
      return contents;
    } finally {
      await Deno.remove(stagingRoot, { recursive: true });
    }
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
