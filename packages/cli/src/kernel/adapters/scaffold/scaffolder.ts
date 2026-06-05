/**
 * @module infra/scaffold/scaffolder
 *
 * Directory-walking scaffold engine that implements {@link ScaffolderPort}.
 *
 * The {@link Scaffolder} walks a template directory tree, renders each
 * `.template` file through an {@link TemplatePort}, applies dotfile
 * conventions, and writes the results to a target directory. Non-template
 * files are copied verbatim.
 *
 * All filesystem access goes through {@link FileSystemPort} so the
 * engine can be tested with an in-memory adapter and run in dry-run mode.
 */

import { basename, dirname, join, relative } from '@std/path';
import { globToRegExp } from '@std/path/glob-to-regexp';

import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import type { ScaffoldOptions, ScaffoldResult } from '../../domain/core-types.ts';
import { TEMPLATE_CONVENTIONS } from '../../constants/template-conventions.ts';

/**
 * Core scaffold engine that walks template directories, renders templates,
 * and writes output files.
 *
 * Uses {@link TemplatePort} for variable substitution and
 * {@link FileSystemPort} for all I/O — never touches Deno APIs directly.
 *
 * @example
 * ```typescript
 * const scaffolder = new Scaffolder(templateAdapter, fsAdapter);
 * const result = await scaffolder.scaffold({
 *   templatePath: '/templates/service',
 *   targetPath: '/out/my-service',
 *   variables: { name: 'my-service' },
 * });
 * outputText(`Created ${result.filesCreated.length} files`);
 * ```
 */
export class Scaffolder implements ScaffolderPort {
  /**
   * Create a new Scaffolder instance.
   *
   * @param template - Template adapter for rendering `{{var}}` placeholders.
   * @param fs - Filesystem adapter for all read/write operations.
   */
  constructor(
    private readonly template: TemplatePort,
    private readonly fs: FileSystemPort,
  ) {}

  /**
   * Scaffold a full directory tree from templates.
   *
   * Walks the template directory recursively, rendering `.template` files
   * through the template adapter and copying all other files verbatim.
   * Applies dotfile conventions from {@link TEMPLATE_CONVENTIONS.DOTFILE_MAP}
   * and respects ignore patterns and overwrite settings.
   *
   * **Algorithm (9 steps):**
   * 1. Validate that the template path exists.
   * 2. Create the target directory if `createTargetDir !== false`.
   * 3. Initialize tracking arrays and start timer.
   * 4. Walk the template directory recursively.
   *    - a. Compute relative path from the template root.
   *    - b. Skip entries matching ignore patterns.
   *    - c. Create directories under the target path.
   *    - d. Process files: strip `.template`, apply dotfile map, render or
   *         copy, and write to the target path.
   * 5. Return a {@link ScaffoldResult} with duration and file counts.
   *
   * @param options - Scaffold configuration including paths, variables, and flags.
   * @returns Result tracking all created, skipped, and created directories.
   * @throws {Error} If the template directory does not exist.
   */
  async scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
    const {
      templatePath,
      targetPath,
      variables,
      overwrite = false,
      ignore = [],
      createTargetDir,
    } = options;

    // Step 1: Validate template path exists
    const templateExists = await this.fs.exists(templatePath);
    if (!templateExists) {
      throw new Error(
        `Template directory does not exist: ${templatePath}`,
      );
    }

    // Step 2: Create target directory if requested (default: true)
    if (createTargetDir !== false) {
      await this.fs.createDir(targetPath);
    }

    // Step 3: Initialize tracking
    const filesCreated: string[] = [];
    const directoriesCreated: string[] = [];
    const filesSkipped: string[] = [];
    const start = performance.now();

    // Track ignored directory prefixes so descendants are also pruned.
    const ignoredDirPrefixes: string[] = [];

    // Step 4: Walk template directory recursively
    for await (const entry of this.fs.walk(templatePath)) {
      // 4a: Compute relative path from the template root
      const rel = relative(templatePath, entry.path);

      // Skip the root entry itself
      if (rel === '' || rel === '.') {
        continue;
      }

      // Check whether this entry lives under a previously-ignored directory.
      const normalizedRel = rel.replace(/\\/g, '/');
      if (ignoredDirPrefixes.some((prefix) => normalizedRel.startsWith(prefix))) {
        continue;
      }

      // 4b: Skip if matches any ignore pattern
      if (this.matchesIgnorePattern(rel, ignore)) {
        // If the matching entry is a directory, remember its prefix so that
        // all descendants are also pruned without re-running the pattern.
        if (entry.isDirectory) {
          ignoredDirPrefixes.push(normalizedRel + '/');
        }
        continue;
      }

      // 4c: If directory → create under target and record
      if (entry.isDirectory) {
        const targetDir = join(targetPath, rel);
        await this.fs.createDir(targetDir);
        directoriesCreated.push(targetDir);
        continue;
      }

      // 4d: If file → render or copy
      if (entry.isFile) {
        const isTemplate = rel.endsWith(TEMPLATE_CONVENTIONS.TEMPLATE_EXTENSION);

        // Compute output filename: strip .template extension if present
        let outputRel = isTemplate
          ? rel.slice(0, -TEMPLATE_CONVENTIONS.TEMPLATE_EXTENSION.length)
          : rel;

        // Apply dotfile convention on the filename component
        const outputDir = dirname(outputRel);
        let outputName = basename(outputRel);
        const dotfileMapped = TEMPLATE_CONVENTIONS.DOTFILE_MAP[outputName];
        if (dotfileMapped) {
          outputName = dotfileMapped;
        }
        outputRel = outputDir === '.' ? outputName : join(outputDir, outputName);

        // Compute full target path
        const fullTargetPath = join(targetPath, outputRel);

        // Check overwrite protection
        const targetExists = await this.fs.exists(fullTargetPath);
        if (targetExists && !overwrite) {
          filesSkipped.push(fullTargetPath);
          continue;
        }

        // Read source content
        const sourceContent = await this.fs.readFile(entry.path);

        // Render if template, otherwise use raw content
        const outputContent = isTemplate
          ? await this.template.render(sourceContent, variables)
          : sourceContent;

        // Write to target
        await this.fs.writeFile(fullTargetPath, outputContent);
        filesCreated.push(fullTargetPath);
      }
    }

    // Step 5: Return result
    const durationMs = performance.now() - start;
    return {
      filesCreated,
      directoriesCreated,
      filesSkipped,
      totalOperations: filesCreated.length + directoriesCreated.length,
      durationMs,
    };
  }

  /**
   * Scaffold a single file from a template string.
   *
   * Renders the template content with the given variables and writes the
   * result to the target path. Respects overwrite protection.
   *
   * @param templateContent - Raw template string with `{{var}}` placeholders.
   * @param targetPath - Absolute path for the output file.
   * @param variables - Template variables for rendering.
   * @param overwrite - Whether to overwrite if the target already exists.
   * @returns `true` if the file was written, `false` if skipped.
   */
  async scaffoldFile(
    templateContent: string,
    targetPath: string,
    variables: Record<string, string>,
    overwrite = false,
  ): Promise<boolean> {
    // Render template
    const rendered = await this.template.render(templateContent, variables);

    // Check overwrite protection
    const targetExists = await this.fs.exists(targetPath);
    if (targetExists && !overwrite) {
      return false;
    }

    await this.fs.writeFile(targetPath, rendered);
    return true;
  }

  /**
   * Write a pre-rendered string directly to the filesystem.
   *
   * Used for Tier 1 programmatic output that does not need template
   * rendering. Respects overwrite protection and ensures parent
   * directories exist.
   *
   * @param targetPath - Absolute path for the output file.
   * @param content - Already-rendered content to write.
   * @param overwrite - Whether to overwrite if the target already exists.
   * @returns `true` if the file was written, `false` if skipped.
   */
  async writeFile(
    targetPath: string,
    content: string,
    overwrite = false,
  ): Promise<boolean> {
    // Check overwrite protection
    const targetExists = await this.fs.exists(targetPath);
    if (targetExists && !overwrite) {
      return false;
    }

    // Ensure parent directory exists
    const parentDir = dirname(targetPath);
    await this.fs.createDir(parentDir);

    await this.fs.writeFile(targetPath, content);
    return true;
  }

  /**
   * Create a directory and all parent directories.
   *
   * Idempotent — succeeds even if the directory already exists.
   *
   * @param dirPath - Absolute path to the directory.
   */
  async createDir(dirPath: string): Promise<void> {
    await this.fs.createDir(dirPath);
  }

  /**
   * Check if a path exists in the output filesystem.
   *
   * Useful for overwrite protection and conditional scaffolding.
   *
   * @param path - Absolute path to check.
   * @returns `true` if the path exists, `false` otherwise.
   */
  async exists(path: string): Promise<boolean> {
    return await this.fs.exists(path);
  }

  /**
   * Check whether a relative path matches any of the ignore patterns.
   *
   * Patterns are treated as glob expressions and converted to regular
   * expressions via `@std/path/glob-to-regexp`. This supports standard
   * glob syntax including `*`, `**`, `?`, and character classes, matching
   * the same conventions used by `.gitignore` and `@std/fs/walk`.
   *
   * Examples of valid patterns:
   * - `*.test.ts` — all test files at any level
   * - `__snapshots__/**` — entire snapshot directories
   * - `node_modules` — exact directory name match
   *
   * @param relativePath - POSIX-normalised path relative to the template root.
   * @param patterns - Glob patterns to match against.
   * @returns `true` if the path should be skipped.
   */
  private matchesIgnorePattern(
    relativePath: string,
    patterns: readonly string[],
  ): boolean {
    const normalized = relativePath.replace(/\\/g, '/');
    for (const pattern of patterns) {
      const re = globToRegExp(pattern, { extended: true, globstar: true });
      if (re.test(normalized)) {
        return true;
      }
    }
    return false;
  }
}
