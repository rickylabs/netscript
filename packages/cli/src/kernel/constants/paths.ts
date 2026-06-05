/**
 * Path and file-name constants shared by CLI command modes.
 */

/** Standard workspace directory names emitted by scaffolding flows. */
export const WORKSPACE_DIRS = {
  apps: 'apps',
  services: 'services',
  contracts: 'contracts',
  plugins: 'plugins',
  packages: 'packages',
  workers: 'workers',
  sagas: 'sagas',
  triggers: 'triggers',
  database: 'database',
  dotnet: 'dotnet',
  apphost: 'AppHost',
  aspire: 'aspire',
} as const;

/** Standard file names emitted by scaffolding flows. */
export const WORKSPACE_FILES = {
  denoJson: 'deno.json',
  netscriptConfig: 'netscript.config.ts',
  appsettings: 'appsettings.json',
  aspireConfig: 'aspire.config.json',
  gitignore: '.gitignore',
  mod: 'mod.ts',
  main: 'main.ts',
  registry: 'registry.ts',
  readme: 'README.md',
} as const;
