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
  PROGRAM_CS: 'Program.cs',
  GLOBAL_JSON: 'global.json',
  README: 'README.md',
  NUGET_CONFIG: 'NuGet.Config',
  APPHOST_CSPROJ: 'AppHost.csproj',
  SERVICE_DEFAULTS_CSPROJ: 'ServiceDefaults.csproj',
  EXTENSIONS_CS: 'Extensions.cs',
  TELEMETRY_DEFAULTS_CS: 'NetScriptTelemetryDefaults.cs',
  LAUNCH_SETTINGS: 'launchSettings.json',
  APPHOST_TS: 'apphost.ts',
} as const;

export type ScaffoldFileKey = keyof typeof SCAFFOLD_FILES;
