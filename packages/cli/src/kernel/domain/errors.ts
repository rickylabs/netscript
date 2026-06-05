import { CliExitError } from './errors/cli-exit-error.ts';

/**
 * @module errors
 * Typed error hierarchy for the NetScript CLI.
 *
 * All errors extend CLIError, which extends the native Error class.
 * Use `instanceof` checks to narrow error types in catch blocks.
 */

/**
 * Exit codes for CLI process termination.
 * Grouped by category (1xx config, 2xx compile, 3xx deploy, 4xx env, 9xx unknown).
 */
export const ExitCode = {
  SUCCESS: 0,

  // Config errors (1xx)
  CONFIG_NOT_FOUND: 100,
  CONFIG_INVALID: 101,
  CONFIG_LOAD_FAILED: 102,

  // Compile errors (2xx)
  COMPILE_FAILED: 200,
  COMPILE_TIMEOUT: 201,
  BUNDLE_FAILED: 202,

  // Deploy errors (3xx)
  SERVY_NOT_FOUND: 300,
  ADMIN_REQUIRED: 301,
  SERVICE_EXISTS: 302,
  DEPLOY_FAILED: 303,
  START_FAILED: 304,

  // Environment errors (4xx)
  WINDOWS_REQUIRED: 400,
  DENO_NOT_FOUND: 401,

  // Scaffold errors (5xx)
  SCAFFOLD_FAILED: 500,
  SCAFFOLD_DIR_EXISTS: 501,
  SCAFFOLD_VALIDATION_FAILED: 502,
  SCAFFOLD_TEMPLATE_ERROR: 503,
  SCAFFOLD_GIT_FAILED: 504,
  SCAFFOLD_DOTNET_FAILED: 505,

  // Runtime errors (9xx)
  UNKNOWN: 999,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Base CLI error class with an exit code and optional context map.
 */
export class CLIError extends CliExitError {
  constructor(
    public override readonly exitCode: ExitCode,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message, { context });
    this.name = 'CLIError';
  }
}

/**
 * Thrown when a scaffold operation fails during a specific pipeline phase.
 *
 * Includes context about which phase failed, the offending file path,
 * and how many files were successfully created before the failure.
 */
export class ScaffoldError extends CLIError {
  constructor(
    phase: string,
    filePath: string,
    cause: Error,
    completedFiles: string[],
  ) {
    super(
      ExitCode.SCAFFOLD_FAILED,
      `Scaffold failed during ${phase} while processing ${filePath}: ${cause.message}`,
      { phase, filePath, completedFiles: completedFiles.length },
    );
    this.name = 'ScaffoldError';
  }
}

/**
 * Thrown when the target directory already exists and `--force` was not specified.
 */
export class ScaffoldDirExistsError extends CLIError {
  constructor(targetDir: string) {
    super(
      ExitCode.SCAFFOLD_DIR_EXISTS,
      `Directory "${targetDir}" already exists. Use --force to overwrite.`,
      { targetDir },
    );
    this.name = 'ScaffoldDirExistsError';
  }
}

/**
 * Thrown when scaffold input validation fails (invalid name, missing required options, etc.).
 */
export class ScaffoldValidationError extends CLIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ExitCode.SCAFFOLD_VALIDATION_FAILED, message, context);
    this.name = 'ScaffoldValidationError';
  }
}

/**
 * Thrown when a template rendering operation fails (undefined variable, bad pipe, etc.).
 */
export class ScaffoldTemplateError extends CLIError {
  constructor(templatePath: string, cause: Error) {
    super(
      ExitCode.SCAFFOLD_TEMPLATE_ERROR,
      `Template rendering failed for "${templatePath}": ${cause.message}`,
      { templatePath },
    );
    this.name = 'ScaffoldTemplateError';
  }
}

/**
 * Thrown when `git init` fails during scaffold.
 */
export class ScaffoldGitError extends CLIError {
  constructor(reason: string) {
    super(
      ExitCode.SCAFFOLD_GIT_FAILED,
      `Git initialization failed: ${reason}. Use --no-git to skip.`,
    );
    this.name = 'ScaffoldGitError';
  }
}

/**
 * Thrown when the netscript.config.ts or appsettings.json cannot be found.
 */
export class ConfigNotFoundError extends CLIError {
  constructor(searchedPaths: string[]) {
    super(
      ExitCode.CONFIG_NOT_FOUND,
      `NetScript config not found. Searched: ${searchedPaths.join(', ')}`,
      { searchedPaths },
    );
    this.name = 'ConfigNotFoundError';
  }
}

/**
 * Thrown when the config file is found but fails Zod validation.
 */
export class ConfigInvalidError extends CLIError {
  constructor(message: string, configPath: string) {
    super(ExitCode.CONFIG_INVALID, message, { configPath });
    this.name = 'ConfigInvalidError';
  }
}

/**
 * Thrown when deno compile fails for a service.
 */
export class CompileError extends CLIError {
  constructor(serviceName: string, reason: string) {
    super(
      ExitCode.COMPILE_FAILED,
      `Compile failed for "${serviceName}": ${reason}`,
      { serviceName },
    );
    this.name = 'CompileError';
  }
}

/**
 * Thrown when deno compile or bundle exceeds the configured timeout.
 */
export class CompileTimeoutError extends CLIError {
  constructor(serviceName: string, timeoutMs: number) {
    super(
      ExitCode.COMPILE_TIMEOUT,
      `Compile timed out for "${serviceName}" after ${timeoutMs}ms`,
      { serviceName, timeoutMs },
    );
    this.name = 'CompileTimeoutError';
  }
}

/**
 * Thrown when the Servy CLI executable is not found on the system.
 */
export class ServyNotFoundError extends CLIError {
  constructor(servyPath: string) {
    super(
      ExitCode.SERVY_NOT_FOUND,
      `Servy CLI not found at: ${servyPath}\nInstall Servy from https://github.com/aelassas/servy`,
      { servyPath },
    );
    this.name = 'ServyNotFoundError';
  }
}

/**
 * Thrown when a Windows-only operation is attempted on a non-Windows platform.
 */
export class WindowsRequiredError extends CLIError {
  constructor(operation: string) {
    super(
      ExitCode.WINDOWS_REQUIRED,
      `The "${operation}" operation requires Windows`,
      { operation },
    );
    this.name = 'WindowsRequiredError';
  }
}

/**
 * Thrown when the install command requires administrator privileges.
 */
export class AdminRequiredError extends CLIError {
  constructor() {
    super(
      ExitCode.ADMIN_REQUIRED,
      'This operation requires administrator privileges. Run as Administrator.',
    );
    this.name = 'AdminRequiredError';
  }
}

/**
 * Thrown when a service is already installed and --force is not set.
 */
export class ServiceExistsError extends CLIError {
  constructor(serviceName: string) {
    super(
      ExitCode.SERVICE_EXISTS,
      `Service "${serviceName}" is already installed. Use --force to overwrite.`,
      { serviceName },
    );
    this.name = 'ServiceExistsError';
  }
}

/**
 * Format a caught unknown error into a human-readable string.
 * Never use `any` in catch blocks — always pass through this helper.
 */
export function formatError(error: unknown): string {
  if (error instanceof CLIError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}
