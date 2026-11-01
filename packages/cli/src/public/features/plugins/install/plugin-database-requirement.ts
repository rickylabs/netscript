import { parse } from 'jsr:@std/dotenv@~0.225.5/parse';
import { join } from '@std/path';
import type { PluginInstallerManifest } from '@netscript/plugin/protocol';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';

/** Selected plugin configuration and its specialized static installer metadata. */
export interface SelectedPluginDatabaseRequirement {
  readonly manifest: PluginInstallerManifest;
  readonly configuration?: Readonly<Record<string, string>>;
}

/** Resolve a declared database selector before any provisioning or plugin execution. */
export async function selectPluginDatabaseRequirement(
  manifest: PluginInstallerManifest,
  projectRoot: string,
  fs: FileSystemPort,
  readEnvironment: (key: string) => string | undefined = () => undefined,
): Promise<SelectedPluginDatabaseRequirement> {
  const requirement = manifest.databaseRequirement;
  if (requirement === undefined) return { manifest };

  const key = requirement.environmentVariable;
  let value = readEnvironment(key);
  const envPath = join(projectRoot, '.env');
  if (value === undefined && await fs.exists(envPath)) {
    value = parse(await fs.readFile(envPath))[key];
  }
  const settingsPath = join(projectRoot, 'appsettings.json');
  if (value === undefined && await fs.exists(settingsPath)) {
    const settings: unknown = JSON.parse(await fs.readFile(settingsPath));
    for (const path of requirement.appsettingsPaths) {
      let candidate = settings;
      for (const property of path) {
        candidate = candidate !== null && typeof candidate === 'object' &&
            Object.hasOwn(candidate, property)
          ? Reflect.get(candidate, property)
          : undefined;
      }
      if (typeof candidate === 'string') {
        value = candidate;
        break;
      }
    }
  }
  value ??= requirement.defaultValue;
  if (!Object.hasOwn(requirement.values, value)) {
    throw new ScaffoldValidationError(
      `Unsupported ${key} value. Expected one of: ${Object.keys(requirement.values).join(', ')}.`,
    );
  }
  const requiresDb = requirement.values[value];
  return {
    configuration: { [key]: value },
    manifest: {
      ...manifest,
      capabilities: { ...manifest.capabilities, hasDatabaseMigrations: requiresDb },
      ...(manifest.provider
        ? {
          provider: {
            ...manifest.provider,
            defaultRequiresDb: requiresDb,
            infrastructureRequires: [
              ...manifest.provider.infrastructureRequires.filter((entry) => entry !== 'db'),
              ...(requiresDb ? ['db'] : []),
            ],
          },
        }
        : {}),
      ...(manifest.officialSource
        ? { officialSource: { ...manifest.officialSource, requiresDb } }
        : {}),
    },
  };
}
