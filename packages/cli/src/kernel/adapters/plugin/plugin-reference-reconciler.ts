import { basename, join } from '@std/path';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import {
  readConfiguredPluginDirectories,
  readInstalledDeclarations,
} from './installed-plugin-declarations.ts';

interface AppsettingsShape {
  NetScript?: {
    Plugins?: Record<string, ReferenceEntry>;
    BackgroundProcessors?: Record<string, ReferenceEntry>;
    Services?: Record<string, ReferenceEntry>;
    Apps?: Record<string, ReferenceEntry>;
  };
}

interface ReferenceEntry {
  PluginReferences?: string[];
  readonly [key: string]: unknown;
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
  const services = appsettings.NetScript?.Services ?? {};
  const apps = appsettings.NetScript?.Apps ?? {};
  const configuredDirectories = await readConfiguredPluginDirectories(projectRoot, fs);
  const installedKeys = new Set([
    ...Object.keys(plugins),
    ...Object.keys(backgroundProcessors),
    ...configuredDirectories.map((directory) => basename(directory)),
  ]);
  const declarations = await readInstalledDeclarations(
    projectRoot,
    plugins,
    backgroundProcessors,
    configuredDirectories,
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

    if (installedKeys.has(declaration.resourceConfigKey)) {
      addConsumerReference(services, declaration.consumers.services, declaration.resourceConfigKey);
      addConsumerReference(apps, declaration.consumers.apps, declaration.resourceConfigKey);
    }
  }

  pruneUninstalledReferences(services, installedKeys);
  pruneUninstalledReferences(apps, installedKeys);

  if (!appsettings.NetScript) return;
  setReconciledRecord(appsettings.NetScript, 'Plugins', plugins);
  setReconciledRecord(appsettings.NetScript, 'BackgroundProcessors', backgroundProcessors);
  setReconciledRecord(appsettings.NetScript, 'Services', services);
  setReconciledRecord(appsettings.NetScript, 'Apps', apps);
  await fs.writeFile(appsettingsPath, `${JSON.stringify(appsettings, null, 2)}\n`);
}

function setPluginReferences(
  entry: ReferenceEntry,
  references: readonly string[],
): void {
  if (references.length === 0) {
    delete entry.PluginReferences;
  } else {
    entry.PluginReferences = [...references];
  }
}

function addConsumerReference(
  entries: Readonly<Record<string, ReferenceEntry>>,
  consumers: readonly string[],
  resourceConfigKey: string,
): void {
  for (const consumer of consumers) {
    const entry = entries[consumer];
    if (!entry) continue;
    const references = new Set(entry.PluginReferences ?? []);
    references.add(resourceConfigKey);
    setPluginReferences(entry, [...references].sort());
  }
}

function pruneUninstalledReferences(
  entries: Readonly<Record<string, ReferenceEntry>>,
  installedKeys: ReadonlySet<string>,
): void {
  for (const entry of Object.values(entries)) {
    setPluginReferences(
      entry,
      (entry.PluginReferences ?? []).filter((reference) => installedKeys.has(reference)).sort(),
    );
  }
}

function sortRecord<T>(record: Readonly<Record<string, T>>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function setReconciledRecord(
  netScript: NonNullable<AppsettingsShape['NetScript']>,
  key: 'Plugins' | 'BackgroundProcessors' | 'Services' | 'Apps',
  record: Readonly<Record<string, ReferenceEntry>>,
): void {
  if (netScript[key] !== undefined || Object.keys(record).length > 0) {
    netScript[key] = sortRecord(record);
  }
}
