import { extname, resolve } from '@std/path';
import { tmpdir } from 'node:os';
import type {
  GeneratedFileFormatPolicy,
  GeneratedSourceContent,
  GeneratedSourceFormatterPort,
} from '../../../ports/generated-source-formatter-port.ts';
import type { ProcessPort, ProcessResult } from '../../../ports/process-port.ts';
import {
  GENERATED_FORMAT_ARGS,
  MAX_BATCH_CHARACTERS,
  SUPPORTED_EXTENSIONS,
} from './generated-source-format-policy.ts';

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

  /** Format a batch with one staging child and one formatter, even in a write-denied caller. */
  async formatContents(files: readonly GeneratedSourceContent[]): Promise<readonly string[]> {
    if (
      files.length > 256 || files.some((file) => file.content.length > 16 * 1024 * 1024) ||
      files.reduce((total, file) => total + file.content.length, 0) > MAX_BATCH_CHARACTERS
    ) {
      throw new Error('Generated source batch exceeds its bounded capacity.');
    }
    const payload = files.map((file) => {
      const extension = extname(file.targetPath).slice(1).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(extension)) {
        throw new Error(
          `Unable to format generated source for ${file.targetPath}: unsupported or missing target extension.`,
        );
      }
      return { extension, content: file.content };
    });
    if (files.length === 0) return [];
    const temporaryDirectory = resolve(tmpdir());
    const result = await this.process.exec('deno', [
      'run',
      '--no-config',
      '--no-lock',
      '--no-prompt',
      '--allow-read',
      `--allow-write=${temporaryDirectory}`,
      '--allow-run=deno',
      '--deny-net',
      '--deny-env',
      new URL('./generated-source-batch-child.ts', import.meta.url).href,
      temporaryDirectory,
    ], { stdin: JSON.stringify(payload) });
    if (result.code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`;
      throw new Error(`Unable to format generated source batch: ${detail}`);
    }
    const response: unknown = JSON.parse(result.stdout);
    if (!isBatchResponse(response, files.length)) {
      throw new Error('Invalid generated formatting response.');
    }
    return response.contents;
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

function isBatchResponse(value: unknown, count: number): value is { contents: string[] } {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  return result.formatterProcesses === 1 && Array.isArray(result.contents) &&
    result.contents.length === count &&
    result.contents.every((content) =>
      typeof content === 'string' && content.length <= 16 * 1024 * 1024
    ) &&
    result.contents.reduce((total, content) => total + content.length, 0) <= MAX_BATCH_CHARACTERS;
}
