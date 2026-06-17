import type { ScaffoldOptions, ScaffoldResult } from '../../domain/core-types.ts';
import type { ScaffolderPort } from '../../ports/template-port.ts';

/** In-memory scaffolder for application tests that do not need a temp directory. */
export class InMemoryScaffolder implements ScaffolderPort {
  readonly files = new Map<string, string>();
  readonly directories = new Set<string>();

  async scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
    await this.createDir(options.targetPath);
    return {
      filesCreated: [],
      directoriesCreated: [options.targetPath],
      filesSkipped: [],
      totalOperations: 1,
      durationMs: 0,
    };
  }

  async scaffoldFile(
    templateContent: string,
    targetPath: string,
    variables: Record<string, string>,
    overwrite = false,
  ): Promise<boolean> {
    const rendered = templateContent.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
      variables[key] ?? ''
    );
    return await this.writeFile(targetPath, rendered, overwrite);
  }

  writeFile(targetPath: string, content: string, overwrite = false): Promise<boolean> {
    if (!overwrite && this.files.has(targetPath)) return Promise.resolve(false);
    this.files.set(targetPath, content);
    return Promise.resolve(true);
  }

  createDir(dirPath: string): Promise<void> {
    this.directories.add(dirPath);
    return Promise.resolve();
  }

  exists(path: string): Promise<boolean> {
    return Promise.resolve(this.files.has(path) || this.directories.has(path));
  }
}
