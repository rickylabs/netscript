/**
 * Standard NetScript scaffold paths, file names, and Deno permissions.
 *
 * @example
 * ```ts
 * import { PERMISSIONS, SCAFFOLD_DIRS } from "@netscript/config/paths";
 *
 * const pluginRoot = SCAFFOLD_DIRS.PLUGINS;
 * const serviceFlags = PERMISSIONS.serviceDefault;
 * ```
 */

/** Standard scaffold directory names used by NetScript generators. */
export interface ScaffoldDirs {
  /** Directory containing project plugin sources. */
  readonly PLUGINS: 'plugins';
  /** Directory containing service sources. */
  readonly SERVICES: 'services';
  /** Directory containing database schemas and migrations. */
  readonly DATABASE: 'database';
  /** Directory containing contract definitions. */
  readonly CONTRACTS: 'contracts';
  /** Directory containing app projects. */
  readonly APPS: 'apps';
  /** Directory containing package projects. */
  readonly PACKAGES: 'packages';
  /** Directory containing worker runtime files. */
  readonly WORKERS: 'workers';
  /** Directory containing saga runtime files. */
  readonly SAGAS: 'sagas';
  /** Directory containing trigger runtime files. */
  readonly TRIGGERS: 'triggers';
  /** Directory containing task definitions. */
  readonly TASKS: 'tasks';
  /** Directory containing Windows deployment output. */
  readonly DEPLOY: '.deploy/windows';
}

/** Standard scaffold file names used by NetScript generators. */
export interface ScaffoldFiles {
  /** Deno workspace manifest file name. */
  readonly DENO_JSON: 'deno.json';
  /** Deno lockfile name. */
  readonly DENO_LOCK: 'deno.lock';
  /** NetScript project config file name. */
  readonly NETSCRIPT_CONFIG: 'netscript.config.ts';
  /** Aspire appsettings file name. */
  readonly APPSETTINGS: 'appsettings.json';
  /** Generated plugin registry file name. */
  readonly REGISTRY: 'registry.ts';
  /** TypeScript module barrel file name. */
  readonly MOD: 'mod.ts';
  /** Package README file name. */
  readonly README: 'README.md';
  /** Git ignore file name. */
  readonly GITIGNORE: '.gitignore';
}

/** Standard Deno permission groups used by generated package commands. */
export interface PermissionGroups {
  /** Network access permission flags. */
  readonly network: readonly ['--allow-net'];
  /** Read access permission flags. */
  readonly read: readonly ['--allow-read'];
  /** Write access permission flags. */
  readonly write: readonly ['--allow-write'];
  /** Environment access permission flags. */
  readonly env: readonly ['--allow-env'];
  /** Subprocess execution permission flags. */
  readonly run: readonly ['--allow-run'];
  /** System information permission flags. */
  readonly sys: readonly ['--allow-sys'];
  /** Full permission flags. */
  readonly all: readonly ['--allow-all'];
  /** Default permission flags for generated services. */
  readonly serviceDefault: readonly ['--allow-net', '--allow-env', '--allow-read'];
  /** Default permission flags for generated workers. */
  readonly workerDefault: readonly [
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-write',
    '--allow-run',
  ];
}

/**
 * Standard scaffold directory names.
 *
 * @example
 * ```ts
 * import { SCAFFOLD_DIRS } from "@netscript/config/paths";
 * const jobsDir = `${SCAFFOLD_DIRS.WORKERS}/jobs`;
 * ```
 */
export const SCAFFOLD_DIRS: ScaffoldDirs = Object.freeze({
  PLUGINS: 'plugins',
  SERVICES: 'services',
  DATABASE: 'database',
  CONTRACTS: 'contracts',
  APPS: 'apps',
  PACKAGES: 'packages',
  WORKERS: 'workers',
  SAGAS: 'sagas',
  TRIGGERS: 'triggers',
  TASKS: 'tasks',
  DEPLOY: '.deploy/windows',
});

/**
 * Standard scaffold file names.
 *
 * @example
 * ```ts
 * import { SCAFFOLD_FILES } from "@netscript/config/paths";
 * const configFile = SCAFFOLD_FILES.NETSCRIPT_CONFIG;
 * ```
 */
export const SCAFFOLD_FILES: ScaffoldFiles = Object.freeze({
  DENO_JSON: 'deno.json',
  DENO_LOCK: 'deno.lock',
  NETSCRIPT_CONFIG: 'netscript.config.ts',
  APPSETTINGS: 'appsettings.json',
  REGISTRY: 'registry.ts',
  MOD: 'mod.ts',
  README: 'README.md',
  GITIGNORE: '.gitignore',
});

/**
 * Standard Deno permission flags grouped by intent.
 *
 * @example
 * ```ts
 * import { PERMISSIONS } from "@netscript/config/paths";
 * const flags = PERMISSIONS.workerDefault;
 * ```
 */
export const PERMISSIONS: PermissionGroups = Object.freeze(
  {
    network: ['--allow-net'],
    read: ['--allow-read'],
    write: ['--allow-write'],
    env: ['--allow-env'],
    run: ['--allow-run'],
    sys: ['--allow-sys'],
    all: ['--allow-all'],
    serviceDefault: ['--allow-net', '--allow-env', '--allow-read'],
    workerDefault: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
    ],
  } as const,
);
