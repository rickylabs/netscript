import { join } from '@std/path';
import type { BackgroundProcessorEntry, PluginEntry } from '@netscript/aspire/types';
import type { PluginManifestOfficialSource } from '@netscript/plugin';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';

const SCAFFOLD_PLUGIN_MANIFEST = 'scaffold.plugin.json';

interface AppsettingsShape {
  NetScript?: {
    Plugins?: Record<string, PluginEntry>;
    BackgroundProcessors?: Record<string, BackgroundProcessorEntry>;
  };
}

interface InstalledPluginDeclaration {
  readonly canonicalName: string;
  readonly resourceConfigKey: string;
  readonly backgroundConfigKey?: string;
  readonly dependencies: readonly string[];
  readonly pluginReferences: readonly string[];
}

/** Recompute installed plugin references from persisted plugin declarations. */
export async function reconcilePluginReferences(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<void> {
  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!await fs.exists(appsettingsPath)) return;

  const appsettings = JSON.parse(await fs.readFile(appsettingsPath)) as AppsettingsShape;
  const plugins = appsettings.NetScript?.Plugins ?? {};
  const backgroundProcessors = appsettings.NetScript?.BackgroundProcessors ?? {};
  const installedKeys = new Set([...Object.keys(plugins), ...Object.keys(backgroundProcessors)]);
  const declarations = await readInstalledDeclarations(
    projectRoot,
    plugins,
    backgroundProcessors,
    fs,
  );
  const byCanonicalName = new Map(
    declarations.map((declaration) => [declaration.canonicalName, declaration] as const),
  );

  for (const declaration of declarations) {
    const declaredReferences = new Set(declaration.pluginReferences);
    for (const dependency of declaration.dependencies) {
      const target = byCanonicalName.get(dependency);
      if (target) declaredReferences.add(target.resourceConfigKey);
    }

    const installedReferences = [...declaredReferences]
      .filter((reference) => installedKeys.has(reference))
      .sort();
    const pluginEntry = plugins[declaration.resourceConfigKey];
    if (pluginEntry) setPluginReferences(pluginEntry, installedReferences);

    const backgroundEntry = declaration.backgroundConfigKey
      ? backgroundProcessors[declaration.backgroundConfigKey]
      : undefined;
    if (backgroundEntry) {
      const backgroundReferences = new Set(installedReferences);
      if (installedKeys.has(declaration.resourceConfigKey)) {
        backgroundReferences.add(declaration.resourceConfigKey);
      }
      setPluginReferences(backgroundEntry, [...backgroundReferences].sort());
    }
  }

  if (!appsettings.NetScript) return;
  appsettings.NetScript.Plugins = sortRecord(plugins);
  appsettings.NetScript.BackgroundProcessors = sortRecord(backgroundProcessors);
  await fs.writeFile(appsettingsPath, `${JSON.stringify(appsettings, null, 2)}\n`);
}

async function readInstalledDeclarations(
  projectRoot: string,
  plugins: Readonly<Record<string, PluginEntry>>,
  backgroundProcessors: Readonly<Record<string, BackgroundProcessorEntry>>,
  fs: FileSystemPort,
): Promise<InstalledPluginDeclaration[]> {
  const installedKeys = new Set([...Object.keys(plugins), ...Object.keys(backgroundProcessors)]);
  const candidateNames = new Set<string>();
  for (const key of installedKeys) {
    candidateNames.add(key);
    if (key.endsWith('-api')) candidateNames.add(key.slice(0, -4));
  }

  const declarations = new Map<string, InstalledPluginDeclaration>();
  for (const name of [...candidateNames].sort()) {
    for (const directory of [name, join(SCAFFOLD_DIRS.PLUGINS, name)]) {
      const path = join(projectRoot, directory, SCAFFOLD_PLUGIN_MANIFEST);
      if (!await fs.exists(path)) continue;
      const declaration = parseDeclaration(
        JSON.parse(await fs.readFile(path)),
        name,
        plugins,
        backgroundProcessors,
      );
      if (declaration) declarations.set(declaration.canonicalName, declaration);
      break;
    }
  }
  return [...declarations.values()].sort((left, right) =>
    left.canonicalName.localeCompare(right.canonicalName)
  );
}

function parseDeclaration(
  value: unknown,
  instanceName: string,
  plugins: Readonly<Record<string, PluginEntry>>,
  backgroundProcessors: Readonly<Record<string, BackgroundProcessorEntry>>,
): InstalledPluginDeclaration | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const officialSource = Reflect.get(value, 'officialSource');
  if (!isOfficialSource(officialSource)) return undefined;
  const backgroundConfigKey = backgroundProcessors[instanceName] ? instanceName : undefined;
  const resourceConfigKey = backgroundConfigKey
    ? officialSource.serviceConfigKey
    : (plugins[instanceName] ? instanceName : officialSource.serviceConfigKey);
  return {
    canonicalName: officialSource.canonicalName,
    resourceConfigKey,
    ...(backgroundConfigKey ? { backgroundConfigKey } : {}),
    dependencies: officialSource.dependencies ?? [],
    pluginReferences: officialSource.pluginReferences ?? [],
  };
}

function isOfficialSource(value: unknown): value is PluginManifestOfficialSource {
  return !!value && typeof value === 'object' &&
    typeof Reflect.get(value, 'canonicalName') === 'string' &&
    typeof Reflect.get(value, 'serviceConfigKey') === 'string';
}

function setPluginReferences(
  entry: PluginEntry | BackgroundProcessorEntry,
  references: readonly string[],
): void {
  if (references.length === 0) {
    delete entry.PluginReferences;
  } else {
    entry.PluginReferences = [...references];
  }
}

function sortRecord<T>(record: Readonly<Record<string, T>>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}
