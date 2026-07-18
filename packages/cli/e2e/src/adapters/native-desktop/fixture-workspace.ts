import { copy } from '@std/fs';
import { join, resolve, toFileUrl } from '@std/path';

/** Prepared version-specific desktop fixture. */
export interface PreparedDesktopFixture {
  readonly root: string;
  readonly version: string;
}

function localModule(repoRoot: string, path: string): string {
  return toFileUrl(resolve(repoRoot, path)).href;
}

/** Copy and version the checked-in fixture without mutating source files. */
export async function prepareDesktopFixture(
  repoRoot: string,
  destination: string,
  version: string,
): Promise<PreparedDesktopFixture> {
  const source = join(repoRoot, 'packages', 'cli', 'e2e', 'fixtures', 'desktop-native');
  await copy(source, destination, { overwrite: true });

  const denoPath = join(destination, 'deno.json');
  const config = JSON.parse(await Deno.readTextFile(denoPath)) as Record<string, unknown>;
  config.version = version;
  config.imports = {
    '@netscript/fresh/desktop': localModule(repoRoot, 'packages/fresh/src/runtime/desktop/mod.ts'),
    '@netscript/sdk/auto-update': localModule(repoRoot, 'packages/sdk/src/auto-update/mod.ts'),
    '@netscript/sdk/desktop': localModule(repoRoot, 'packages/sdk/src/desktop/mod.ts'),
    '@netscript/telemetry': localModule(repoRoot, 'packages/telemetry/mod.ts'),
    '@opentelemetry/api': 'npm:@opentelemetry/api@^1.9.0',
    '@orpc/client': 'npm:@orpc/client@^1.14.6',
    '@orpc/server': 'npm:@orpc/server@^1.14.6',
    '@std/assert': 'jsr:@std/assert@^1',
    '@std/path': 'jsr:@std/path@^1',
  };
  await Deno.writeTextFile(denoPath, `${JSON.stringify(config, null, 2)}\n`);

  const appSettingsPath = join(destination, 'dotnet', 'AppHost', 'appsettings.json');
  const appSettings = JSON.parse(await Deno.readTextFile(appSettingsPath)) as Record<
    string,
    unknown
  >;
  const netScript = appSettings.NetScript as Record<string, unknown>;
  netScript.Version = version;
  await Deno.writeTextFile(appSettingsPath, `${JSON.stringify(appSettings, null, 2)}\n`);

  const constantsPath = join(destination, 'src', 'constants.ts');
  const constants = await Deno.readTextFile(constantsPath);
  await Deno.writeTextFile(
    constantsPath,
    constants.replace(
      /export const FIXTURE_VERSION = '[^']+';/,
      `export const FIXTURE_VERSION = '${version}';`,
    ),
  );
  return { root: destination, version };
}
