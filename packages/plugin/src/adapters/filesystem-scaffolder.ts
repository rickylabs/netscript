import type { FileSystemPort, ScaffolderPort, TemplatePort } from '../ports/mod.ts';

/** Options for filesystem plugin scaffolding. */
export interface FilesystemScaffolderOptions {
  readonly fileSystem: FileSystemPort;
  readonly template: TemplatePort;
  readonly files: readonly {
    readonly path: string;
    readonly template: string;
  }[];
  readonly values: Record<string, string>;
}

/** Scaffolder adapter that writes rendered templates through a file system port. */
export class FilesystemScaffolder implements ScaffolderPort {
  constructor(private readonly options: FilesystemScaffolderOptions) {}

  async scaffold(targetRoot: string): Promise<readonly string[]> {
    const written: string[] = [];
    for (const file of this.options.files) {
      const path = `${targetRoot}/${file.path}`;
      const text = this.options.template.render(file.template, this.options.values);
      await this.options.fileSystem.writeText(path, text);
      written.push(path);
    }
    return written;
  }
}
