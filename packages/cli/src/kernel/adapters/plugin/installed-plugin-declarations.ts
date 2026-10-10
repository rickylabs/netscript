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

interface ReferenceEntry {
  PluginReferences?: string[];
  readonly [key: string]: unknown;
}

/** Persisted plugin identity and resource links from an installed manifest. */
export interface InstalledPluginDeclaration {
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

/** Read canonical plugin identities from configured and conventional install directories. */
export async function readInstalledDeclarations(
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

/** Resolve local plugin specifiers declared by netscript.config.ts. */
export async function readConfiguredPluginDirectories(
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
