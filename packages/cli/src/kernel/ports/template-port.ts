/**
 * Template rendering port shared by CLI application services.
 */

/**
 * Abstraction over template rendering.
 */
export interface TemplatePort {
  /** Human-readable engine name. */
  readonly engine: string;

  /** Render a template string with context variables. */
  render(template: string, context: Record<string, string>): Promise<string>;

  /** Read and render a template file with context variables. */
  renderFile(templatePath: string, context: Record<string, string>): Promise<string>;
}

/**
 * Core scaffolding service.
 */
export interface ScaffolderPort {
  /** Scaffold a full directory tree from templates. */
  scaffold(options: import('../domain/core-types.ts').ScaffoldOptions): Promise<
    import('../domain/core-types.ts').ScaffoldResult
  >;

  /** Scaffold a single file from a template string. */
  scaffoldFile(
    templateContent: string,
    targetPath: string,
    variables: Record<string, string>,
    overwrite?: boolean,
  ): Promise<boolean>;

  /** Write a pre-rendered string directly. */
  writeFile(targetPath: string, content: string, overwrite?: boolean): Promise<boolean>;

  /** Create a directory and parents. */
  createDir(dirPath: string): Promise<void>;

  /** Check if a path exists in the output filesystem. */
  exists(path: string): Promise<boolean>;
}
