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
  readonly PLUGINS: 'plugins';
  readonly SERVICES: 'services';
  readonly DATABASE: 'database';
  readonly CONTRACTS: 'contracts';
  readonly APPS: 'apps';
  readonly PACKAGES: 'packages';
  readonly WORKERS: 'workers';
  readonly SAGAS: 'sagas';
  readonly TRIGGERS: 'triggers';
  readonly TASKS: 'tasks';
  readonly DEPLOY: '.deploy/windows';
}

/** Standard scaffold file names used by NetScript generators. */
export interface ScaffoldFiles {
  readonly DENO_JSON: 'deno.json';
  readonly DENO_LOCK: 'deno.lock';
  readonly NETSCRIPT_CONFIG: 'netscript.config.ts';
  readonly APPSETTINGS: 'appsettings.json';
  readonly REGISTRY: 'registry.ts';
  readonly MOD: 'mod.ts';
  readonly README: 'README.md';
  readonly GITIGNORE: '.gitignore';
}

/** Standard Deno permission groups used by generated package commands. */
export interface PermissionGroups {
  readonly network: readonly ['--allow-net'];
  readonly read: readonly ['--allow-read'];
  readonly write: readonly ['--allow-write'];
  readonly env: readonly ['--allow-env'];
  readonly run: readonly ['--allow-run'];
  readonly sys: readonly ['--allow-sys'];
  readonly all: readonly ['--allow-all'];
  readonly serviceDefault: readonly ['--allow-net', '--allow-env', '--allow-read'];
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
