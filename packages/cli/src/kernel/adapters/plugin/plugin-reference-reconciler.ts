import { basename, dirname, join, resolve } from '@std/path';
import {
  parsePluginManifest,
  type PluginManifestLinking,
  type PluginManifestOfficialSource,
} from '@netscript/plugin';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { extractPluginSpecifiers } from './netscript-config-plugin.ts';

const SCAFFOLD_PLUGIN_MANIFEST = 'scaffold.plugin.json';

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

interface InstalledPluginDeclaration {
  readonly canonicalName: string;
  readonly resourceConfigKey: string;
  readonly backgroundConfigKey?: string;
  readonly dependencies: readonly string[];
  readonly pluginReferences: readonly string[];
  readonly consumers: {
    readonly services: readonly string[];
    readonly apps: readonly string[];
  };
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

async function readInstalledDeclarations(
  projectRoot: string,
  plugins: Readonly<Record<string, ReferenceEntry>>,
  backgroundProcessors: Readonly<Record<string, ReferenceEntry>>,
  configuredDirectories: readonly string[],
  fs: FileSystemPort,
): Promise<InstalledPluginDeclaration[]> {
  const declarations = new Map<string, InstalledPluginDeclaration>();
  for (const directory of configuredDirectories) {
    await readDeclarationAt(
      directory,
      basename(directory),
      plugins,
      backgroundProcessors,
      fs,
      declarations,
    );
  }
  for (const root of [projectRoot, join(projectRoot, SCAFFOLD_DIRS.PLUGINS)]) {
    if (!await fs.exists(root)) continue;
    for (const entry of await fs.readDir(root)) {
      if (!entry.isDirectory) continue;
      await readDeclarationAt(
        join(root, entry.name),
        entry.name,
        plugins,
        backgroundProcessors,
        fs,
        declarations,
      );
    }
  }
  return [...declarations.values()].sort((left, right) =>
    left.canonicalName.localeCompare(right.canonicalName)
  );
}

async function readConfiguredPluginDirectories(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const configPath = join(projectRoot, SCAFFOLD_FILES.NETSCRIPT_CONFIG);
  if (!await fs.exists(configPath)) return [];

  return extractPluginSpecifiers(await fs.readFile(configPath))
    .filter((specifier) => specifier.startsWith('.') || specifier.startsWith('/'))
    .map((specifier) => {
      const resolved = resolve(projectRoot, specifier);
      return resolved.endsWith('.ts') ? dirname(resolved) : resolved;
    });
}

async function readDeclarationAt(
  directory: string,
  instanceName: string,
  plugins: Readonly<Record<string, ReferenceEntry>>,
  backgroundProcessors: Readonly<Record<string, ReferenceEntry>>,
  fs: FileSystemPort,
  declarations: Map<string, InstalledPluginDeclaration>,
): Promise<void> {
  const path = join(directory, SCAFFOLD_PLUGIN_MANIFEST);
  if (!await fs.exists(path)) return;
  const declaration = parseDeclaration(
    JSON.parse(await fs.readFile(path)),
    instanceName,
    plugins,
    backgroundProcessors,
  );
  if (declaration) declarations.set(declaration.canonicalName, declaration);
}

function parseDeclaration(
  value: unknown,
  instanceName: string,
  plugins: Readonly<Record<string, ReferenceEntry>>,
  backgroundProcessors: Readonly<Record<string, ReferenceEntry>>,
): InstalledPluginDeclaration | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { netscriptInstall: _installMetadata, ...installerManifest } = value as Record<
    string,
    unknown
  >;
  const parsed = parsePluginManifest(installerManifest);
  if (parsed.ok && parsed.manifest.linking) {
    return fromLinkingDeclaration(parsed.manifest.linking);
  }
  const officialSource = Reflect.get(value, 'officialSource');
  if (!isOfficialSource(officialSource)) return undefined;
  const backgroundConfigKey = backgroundProcessors[instanceName] ? instanceName : undefined;
  const serviceConfigKey = officialSource.serviceConfigKey;
  const resourceConfigKey = backgroundConfigKey
    ? serviceConfigKey ?? instanceName
    : (plugins[instanceName] ? instanceName : serviceConfigKey ?? instanceName);
  return {
    canonicalName: officialSource.canonicalName,
    resourceConfigKey,
    ...(backgroundConfigKey ? { backgroundConfigKey } : {}),
    dependencies: officialSource.dependencies ?? [],
    pluginReferences: officialSource.pluginReferences ?? [],
    consumers: { services: [], apps: [] },
  };
}

function fromLinkingDeclaration(linking: PluginManifestLinking): InstalledPluginDeclaration {
  return {
    canonicalName: linking.canonicalName,
    resourceConfigKey: linking.resourceConfigKey,
    ...(linking.backgroundConfigKey ? { backgroundConfigKey: linking.backgroundConfigKey } : {}),
    dependencies: linking.dependencies ?? [],
    pluginReferences: linking.pluginReferences ?? [],
    consumers: {
      services: linking.consumers.services ?? [],
      apps: linking.consumers.apps ?? [],
    },
  };
}

function isOfficialSource(
  value: unknown,
): value is PluginManifestOfficialSource & { readonly canonicalName: string } {
  return !!value && typeof value === 'object' &&
    typeof Reflect.get(value, 'canonicalName') === 'string';
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
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
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
