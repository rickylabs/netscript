import { basename, resolve } from '@std/path';
import { USER_PORT_RANGE } from '../../constants/port-ranges.ts';
import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_VALIDATION } from '../../constants/scaffold/scaffold-validation.ts';
import { ScaffoldDirExistsError, ScaffoldValidationError } from '../../domain/errors.ts';
import type { InitOptions, ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { InitPipelineContext } from './context.ts';
import { allocateScaffoldDefaultPort } from '../../domain/scaffold/default-port-allocation.ts';
import { deriveDefaultAppName } from '../../domain/scaffold/app-name.ts';

const PRISMA_MODEL_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

function singularize(value: string): string {
  if (value.endsWith('ies') && value.length > 3) {
    return `${value.slice(0, -3)}y`;
  }
  if (value.endsWith('s') && value.length > 1) {
    return value.slice(0, -1);
  }
  return value;
}

function toPascalName(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export async function validateOptions(
  context: InitPipelineContext,
  options: InitOptions,
): Promise<ValidatedInitOptions> {
  // 1. Name format
  if (!SCAFFOLD_VALIDATION.NAME_PATTERN.test(options.name)) {
    throw new ScaffoldValidationError(
      `Invalid project name "${options.name}". ` +
        'Names must be kebab-case, start with a letter, and contain ' +
        'only lowercase letters, digits, and hyphens.',
      { name: options.name, pattern: String(SCAFFOLD_VALIDATION.NAME_PATTERN) },
    );
  }

  // 2. Name length
  if (options.name.length > SCAFFOLD_VALIDATION.NAME_MAX_LENGTH) {
    throw new ScaffoldValidationError(
      `Project name "${options.name}" exceeds the maximum length ` +
        `of ${SCAFFOLD_VALIDATION.NAME_MAX_LENGTH} characters.`,
      { name: options.name, maxLength: SCAFFOLD_VALIDATION.NAME_MAX_LENGTH },
    );
  }

  // 3. Reserved names
  const reserved = SCAFFOLD_VALIDATION.RESERVED_NAMES as readonly string[];
  if (reserved.includes(options.name)) {
    throw new ScaffoldValidationError(
      `"${options.name}" is a reserved name and cannot be used as a ` +
        `project name. Reserved names: ${reserved.join(', ')}`,
      { name: options.name, reservedNames: [...reserved] },
    );
  }

  // 4. Resolve target path
  // When --path is provided it is treated as the *parent* directory; the
  // project name is always appended as a subdirectory so that
  // `--path scaffold/` with name `my-app` produces `scaffold/my-app/`.
  const cwd = resolve(context.cwd());
  const targetPath = options.path
    ? resolve(options.path, options.name)
    : basename(cwd) === options.name
    ? cwd
    : resolve(cwd, options.name);

  // 5. Check existing directory
  if (!options.force && !options.dryRun) {
    const exists = await context.fs.exists(targetPath);
    if (exists) {
      const entries = await context.fs.readDir(targetPath);
      if (entries.length > 0) {
        throw new ScaffoldDirExistsError(targetPath);
      }
    }
  }

  // 6. Resolve and validate app name
  const appName = options.appName ?? deriveDefaultAppName(options.name);

  if (!SCAFFOLD_VALIDATION.NAME_PATTERN.test(appName)) {
    throw new ScaffoldValidationError(
      `Invalid app name "${appName}". ` +
        'App names must be kebab-case, start with a letter, and contain ' +
        'only lowercase letters, digits, and hyphens.',
      { appName, pattern: String(SCAFFOLD_VALIDATION.NAME_PATTERN) },
    );
  }

  // 7. Validate example service fields (only when enabled).
  const dbEngine = options.dbEngine ?? SCAFFOLD_DEFAULTS.DB_ENGINE;
  const includeExampleService = options.includeExampleService ?? false;
  let serviceName: string | undefined;
  let servicePort: number | undefined;
  let serviceHostPort: number | undefined;
  if (includeExampleService) {
    serviceName = options.serviceName ?? SCAFFOLD_DEFAULTS.SERVICE_NAME;
    if (!SCAFFOLD_VALIDATION.NAME_PATTERN.test(serviceName)) {
      throw new ScaffoldValidationError(
        `Invalid service name "${serviceName}". ` +
          'Service names must be kebab-case and start with a letter.',
        { serviceName, pattern: String(SCAFFOLD_VALIDATION.NAME_PATTERN) },
      );
    }
    // An explicitly requested port pins the Aspire host port; the default only
    // supplies the source-literal fallback used when the service runs outside
    // Aspire. Validated against the unprivileged TCP range rather than
    // PORT_RANGES.SERVICE — confining every workspace to a 100-port window is
    // what made host-port collisions near-certain (#952).
    serviceHostPort = options.servicePort;
    if (serviceHostPort !== undefined) {
      if (
        !Number.isInteger(serviceHostPort) ||
        serviceHostPort < USER_PORT_RANGE.start ||
        serviceHostPort > USER_PORT_RANGE.end
      ) {
        throw new ScaffoldValidationError(
          `Service port ${serviceHostPort} must be an integer in ` +
            `[${USER_PORT_RANGE.start}, ${USER_PORT_RANGE.end}].`,
          { servicePort: serviceHostPort },
        );
      }
    }
    servicePort = serviceHostPort ?? allocateScaffoldDefaultPort(
      options.name,
      `service:${serviceName}`,
    );
  }
  const modelName = options.modelName ?? toPascalName(singularize(
    serviceName ?? options.serviceName ?? SCAFFOLD_DEFAULTS.SERVICE_NAME,
  ));
  if (!PRISMA_MODEL_NAME_PATTERN.test(modelName)) {
    throw new ScaffoldValidationError(
      `Invalid model name "${modelName}". Model names must be PascalCase identifiers.`,
      { modelName, pattern: String(PRISMA_MODEL_NAME_PATTERN) },
    );
  }

  return {
    name: options.name,
    appName,
    targetPath,
    importMode: options.importMode,
    editor: options.editor ?? SCAFFOLD_DEFAULTS.EDITOR,
    ...context.resolveModeFields(options),
    force: options.force,
    ci: options.ci,
    dryRun: options.dryRun,
    noGit: options.noGit,
    noAspire: options.noAspire,
    dbEngine,
    cache: options.cache ?? SCAFFOLD_DEFAULTS.CACHE_ENABLED,
    cacheBackend: options.cacheBackend ?? SCAFFOLD_DEFAULTS.CACHE_BACKEND,
    includeExampleService,
    serviceName,
    modelName,
    servicePort,
    serviceHostPort,
  };
}
