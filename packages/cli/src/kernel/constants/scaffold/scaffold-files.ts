/**
 * File names used in scaffold output.
 */
export const SCAFFOLD_FILES = {
  DENO_JSON: 'deno.json',
  PACKAGE_JSON: 'package.json',
  NETSCRIPT_CONFIG: 'netscript.config.ts',
  APPSETTINGS: 'appsettings.json',
  ASPIRE_CONFIG: 'aspire.config.json',
  GITIGNORE: '.gitignore',
  MOD: 'mod.ts',
  MAIN: 'main.ts',
  README: 'README.md',
  APPHOST_MTS: 'apphost.mts',
  ASPIRE_CLI_TASK: 'aspire-cli.ts',
  NODE_MODULES_VERIFIER: 'verify-node-modules.ts',
  QUALITY_RUNNER: 'quality-runner.ts',
  SOURCE_ROOT_MARKER: '.netscript-source-root',
  TSCONFIG_ROOT: 'tsconfig.json',
  TSCONFIG_APP: 'tsconfig.json',
  TSCONFIG_APPHOST: 'tsconfig.apphost.json',
} as const;

export type ScaffoldFileKey = keyof typeof SCAFFOLD_FILES;
