/**
 * File names used in scaffold output.
 */
export const SCAFFOLD_FILES = {
  DENO_JSON: 'deno.json',
  NETSCRIPT_CONFIG: 'netscript.config.ts',
  APPSETTINGS: 'appsettings.json',
  ASPIRE_CONFIG: 'aspire.config.json',
  GITIGNORE: '.gitignore',
  MOD: 'mod.ts',
  MAIN: 'main.ts',
  README: 'README.md',
  APPHOST_MTS: 'apphost.mts',
  TSCONFIG_APPHOST: 'tsconfig.apphost.json',
} as const;

export type ScaffoldFileKey = keyof typeof SCAFFOLD_FILES;
