import { basename, join, relative } from '@std/path';
import { UseCase } from '../../../../kernel/application/abstracts/use-case.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { migrateVariantCss } from './migrate-css.ts';
import { hasVariantSourceMigration, migrateVariantSource } from './migrate-source.ts';
import type { VariantFileChange, VariantMigrationReport } from './variant-migration-contract.ts';

/** Inputs for the bounded app-copy migration. */
export interface MigrateUiVariantsInput {
  readonly appRoot: string;
  readonly dryRun?: boolean;
}

// Do not visit dependency copies, generated outputs, VCS data or symlink targets.
const EXCLUDED = new Set([
  '.git',
  '.deno',
  'node_modules',
  '_fresh',
  'dist',
  'coverage',
  'packages',
  '.agents',
  '.llm',
  '.divybot',
]);

/** Preflight the whole app before any write, preserving user changes that need a manual merge. */
export class MigrateUiVariantsUseCase
  extends UseCase<MigrateUiVariantsInput, VariantMigrationReport> {
  readonly id = 'public.ui.migrate.variants';
  constructor(
    private readonly fs: FileSystemPort,
    private readonly formatter?: GeneratedSourceFormatterPort,
  ) {
    super();
  }

  async execute(input: MigrateUiVariantsInput): Promise<VariantMigrationReport> {
    const changes: VariantFileChange[] = [];
    const diagnostics: string[] = [];
    const visit = async (directory: string): Promise<void> => {
      const entries = (await this.fs.readDir(directory)).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      for (const entry of entries) {
        if (!entry.isFile && !entry.isDirectory) continue;
        const path = join(directory, entry.name);
        if (entry.isDirectory && !EXCLUDED.has(entry.name)) await visit(path);
        if (!entry.isFile || !/\.(?:tsx|css)$/.test(entry.name)) continue;
        const before = await this.fs.readFile(path);
        if (
          !/\bns-[\w-]+/.test(before) &&
          (entry.name.endsWith('.css') || !hasVariantSourceMigration(entry.name, before))
        ) continue;
        const result = entry.name.endsWith('.css')
          ? migrateVariantCss(before)
          : migrateVariantSource(basename(path), before);
        diagnostics.push(
          ...result.diagnostics.map((message) => `${relative(input.appRoot, path)}: ${message}`),
        );
        if (before !== result.content) changes.push({ path, before, after: result.content });
      }
    };
    await visit(input.appRoot);
    if (diagnostics.length) {
      throw new ScaffoldValidationError(
        `Variant migration needs a manual merge; no files written.\n${diagnostics.join('\n')}`,
      );
    }
    if (this.formatter) {
      for (let start = 0; start < changes.length; start += 128) {
        const batch = changes.slice(start, start + 128);
        const contents = await this.formatter.formatContents(
          batch.map((file) => ({ targetPath: file.path, content: file.after })),
        );
        for (let i = 0; i < batch.length; i++) {
          changes[start + i] = { ...batch[i], after: contents[i] };
        }
      }
    }
    if (!input.dryRun) {
      // Recheck all originals before starting the write phase, including edits made during preflight.
      for (const change of changes) {
        if (await this.fs.readFile(change.path) !== change.before) {
          throw new ScaffoldValidationError(
            'App changed during migration preflight; no files written. Retry.',
          );
        }
      }
      const written: VariantFileChange[] = [];
      try {
        for (const change of changes) {
          written.push(change);
          await this.fs.writeFile(change.path, change.after);
        }
      } catch (error) {
        const rollbackErrors: string[] = [];
        for (const change of written.reverse()) {
          try {
            await this.fs.writeFile(change.path, change.before);
          } catch {
            rollbackErrors.push(relative(input.appRoot, change.path));
          }
        }
        if (rollbackErrors.length) {
          throw new Error(
            `Migration write failed; restore these files from version control: ${
              rollbackErrors.join(', ')
            }`,
            { cause: error },
          );
        }
        throw error;
      }
    }
    return {
      changed: changes.map((change) => relative(input.appRoot, change.path)),
      dryRun: input.dryRun ?? false,
    };
  }
}
