import { walk } from '@std/fs';
import { join, relative } from '@std/path';

import { copyDirectoryFiltered } from '../../kernel/adapters/scaffold/directory-copier.ts';
import { SCAFFOLD_DIRS } from '../../kernel/constants/scaffold/scaffold-dirs.ts';

const SCAFFOLD_RUNTIME_MANIFEST = 'scaffold.runtime.json';

export interface PluginScaffoldRuntimeManifest {
  readonly backgroundSampleRules?: readonly BackgroundSampleRule[];
  readonly runtimeRegistryGenerator?: RuntimeRegistryGenerator;
}

interface BackgroundSampleRule {
  readonly workspace: string;
  readonly managed: readonly PathMatcher[];
  readonly keep: readonly string[];
  readonly runtimeDirectories?: readonly string[];
}

interface PathMatcher {
  readonly path?: string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly without?: string;
}

interface RuntimeRegistryGenerator {
  readonly command: string;
  readonly args?: readonly string[];
}

const SKIP_DIRS: readonly string[] = [
  'node_modules',
  '.deno',
  '__snapshots__',
  '_fresh',
];

const TEST_FILE_SUFFIXES: readonly string[] = [
  '_test.ts',
  '_test.tsx',
  '.test.ts',
  '.test.tsx',
];

export async function copyPluginDirectory(
  sourceRoot: string,
  targetPath: string,
  pluginDir: string,
  force: boolean,
) {
  return await copyDirectoryFiltered({
    source: join(sourceRoot, SCAFFOLD_DIRS.PLUGINS, pluginDir),
    dest: join(targetPath, SCAFFOLD_DIRS.PLUGINS, pluginDir),
    skipDirs: SKIP_DIRS,
    skipFileSuffixes: TEST_FILE_SUFFIXES,
    overwrite: force,
  });
}

export async function copyWorkspaceDirectory(
  sourceRoot: string,
  targetPath: string,
  workspaceDir: string,
  force: boolean,
  sourceWorkspaceDir = workspaceDir,
) {
  return await copyDirectoryFiltered({
    source: join(sourceRoot, sourceWorkspaceDir),
    dest: join(targetPath, workspaceDir),
    skipDirs: SKIP_DIRS,
    skipFileSuffixes: TEST_FILE_SUFFIXES,
    overwrite: force,
  });
}

export async function pruneNonPortableBackgroundSamples(options: {
  readonly workspaceDir: string;
  readonly workspaceName: string;
  readonly includeSamples: boolean;
  readonly manifest?: PluginScaffoldRuntimeManifest;
}): Promise<string[]> {
  const rules =
    options.manifest?.backgroundSampleRules?.filter((rule) =>
      rule.workspace === options.workspaceName
    ) ?? [];
  if (rules.length === 0) {
    return [];
  }

  const allowed = new Set(options.includeSamples ? rules.flatMap((rule) => rule.keep) : []);
  const removed: string[] = [];
  for await (const entry of walk(options.workspaceDir, { includeDirs: false })) {
    const rel = relative(options.workspaceDir, entry.path).replaceAll('\\', '/');
    if (!rules.some((rule) => isManagedSamplePath(rule, rel))) {
      continue;
    }
    if (allowed.has(rel)) {
      continue;
    }

    await Deno.remove(entry.path);
    removed.push(entry.path);
  }

  return removed;
}

export function removeCopiedFiles(filesCreated: string[], removedFiles: readonly string[]): void {
  const removed = new Set(removedFiles);
  for (let index = filesCreated.length - 1; index >= 0; index--) {
    if (removed.has(filesCreated[index])) {
      filesCreated.splice(index, 1);
    }
  }
}

export async function ensureBackgroundRuntimeDirs(
  targetPath: string,
  workspaceDir: string,
  manifest?: PluginScaffoldRuntimeManifest,
): Promise<string[]> {
  const created: string[] = [];
  const rules =
    manifest?.backgroundSampleRules?.filter((rule) => rule.workspace === workspaceDir) ??
      [];
  for (const rule of rules) {
    for (const runtimeDir of rule.runtimeDirectories ?? []) {
      const path = join(targetPath, workspaceDir, ...runtimeDir.split('/'));
      await Deno.mkdir(path, { recursive: true });
      created.push(path);
    }
  }
  return created;
}

export async function readPluginScaffoldRuntimeManifest(
  root: string,
  pluginDir: string,
): Promise<PluginScaffoldRuntimeManifest | undefined> {
  const path = join(root, SCAFFOLD_DIRS.PLUGINS, pluginDir, SCAFFOLD_RUNTIME_MANIFEST);
  try {
    return JSON.parse(await Deno.readTextFile(path)) as PluginScaffoldRuntimeManifest;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

export async function regenerateCopiedRuntimeRegistries(
  targetPath: string,
  options: { readonly includeSamples?: boolean } = {},
): Promise<void> {
  const pluginsDir = join(targetPath, SCAFFOLD_DIRS.PLUGINS);
  try {
    for await (const entry of Deno.readDir(pluginsDir)) {
      if (!entry.isDirectory || entry.name.startsWith('.')) continue;
      const pluginDir = join(pluginsDir, entry.name);
      const manifestPath = join(pluginDir, SCAFFOLD_RUNTIME_MANIFEST);
      const manifest = await readJsonFile<PluginScaffoldRuntimeManifest>(manifestPath);
      const generator = manifest?.runtimeRegistryGenerator;
      if (!generator) continue;
      await runRuntimeRegistryGenerator({
        generator,
        manifestPath,
        pluginDir,
        targetPath,
        includeSamples: options.includeSamples ?? true,
      });
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
}

async function readJsonFile<TValue>(path: string): Promise<TValue | undefined> {
  try {
    return JSON.parse(await Deno.readTextFile(path)) as TValue;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

async function runRuntimeRegistryGenerator(options: {
  readonly generator: RuntimeRegistryGenerator;
  readonly manifestPath: string;
  readonly pluginDir: string;
  readonly targetPath: string;
  readonly includeSamples: boolean;
}): Promise<void> {
  const commandPath = join(options.pluginDir, ...options.generator.command.split('/'));
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--no-config',
      '--allow-read',
      '--allow-write',
      commandPath,
      '--project-root',
      options.targetPath,
      '--manifest',
      options.manifestPath,
      ...(options.generator.args ?? []),
      '--official-samples',
      String(options.includeSamples),
    ],
    cwd: options.targetPath,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  if (!output.success) {
    const decoder = new TextDecoder();
    throw new Error(
      `Runtime registry generator failed (${commandPath}): ${
        decoder.decode(output.stderr).trim() || decoder.decode(output.stdout).trim()
      }`,
    );
  }
}

function isManagedSamplePath(rule: BackgroundSampleRule, rel: string): boolean {
  return rule.managed.some((matcher) => matchesPath(matcher, rel));
}

function matchesPath(matcher: PathMatcher, rel: string): boolean {
  if (matcher.without && rel.includes(matcher.without)) return false;
  if (matcher.path && rel !== matcher.path) return false;
  if (matcher.prefix && !rel.startsWith(matcher.prefix)) return false;
  if (matcher.suffix && !rel.endsWith(matcher.suffix)) return false;
  return Boolean(matcher.path ?? matcher.prefix ?? matcher.suffix);
}
