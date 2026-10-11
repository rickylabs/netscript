import { join } from '@std/path';
import { parse as parseJsonc } from '@std/jsonc';
import type {
  RenderedPluginRegistry,
  RenderPluginRegistries,
} from '../../../../kernel/domain/plugin-generated-surface.ts';
import { PLUGIN_SURFACE_GENERATOR } from '../../../../kernel/domain/plugin-generated-surface.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';
import {
  discoverInstalledRuntimePackages,
  type InstalledRuntimePackage,
  type InstalledRuntimeRegistryGeneratorDependencies,
  readRuntimeManifest,
  type ResolvedRuntimeManifest,
  resolveRuntimeManifest,
  type RuntimeRegistryManifest,
} from './runtime-registry-manifests.ts';
import {
  readInspectionFile,
  rejectInspectionLinks,
  validateInspectionDirectories,
} from '../../../../kernel/adapters/service/generated-surface-reader.ts';

const MAX_OUTPUTS = 256;
const MAX_CONTENT = 16 * 1024 * 1024;
const MAX_SOURCES = 4096;

/** Installed plugins use the same manifest resolver for generation and inspection. */
export function createInstalledRuntimeRegistryRenderer(
  dependencies: InstalledRuntimeRegistryGeneratorDependencies,
): RenderPluginRegistries {
  return async (projectRoot) => {
    await rejectInspectionLinks(projectRoot, 'appsettings.json');
    await rejectInspectionLinks(projectRoot, 'deno.json');
    const rendered: RenderedPluginRegistry[] = [];
    const packages = await discoverInstalledRuntimePackages(projectRoot, dependencies.fs);
    if (packages.length > MAX_OUTPUTS) throw new Error('Plugin inspection capacity exceeded.');
    for (const installed of packages) {
      const resolved = await resolveRuntimeManifest(projectRoot, installed, dependencies);
      // Absence cannot establish that an installed producer has no output.
      if (!resolved) throw new Error(`Missing runtime manifest for ${installed.name}.`);
      const manifest = readRuntimeManifest(resolved.value, installed.name);
      if (!manifest.runtimeRegistries?.length) continue;
      if (manifest.runtimeRegistryGenerator?.inspectionProtocol !== 2) {
        throw new Error(`Plugin ${installed.name} requires byte inspection protocol 2.`);
      }
      rendered.push(
        ...await renderRuntimeRegistryPlan(
          projectRoot,
          installed,
          resolved,
          manifest,
          dependencies,
        ),
      );
      if (rendered.length > MAX_OUTPUTS) throw new Error('Plugin output capacity exceeded.');
    }
    return rendered;
  };
}

/** Protocol 2 runs the plugin's own selector and renderer with project writes denied. */
export async function renderRuntimeRegistryPlan(
  projectRoot: string,
  installed: InstalledRuntimePackage,
  resolved: ResolvedRuntimeManifest,
  manifest: RuntimeRegistryManifest,
  dependencies: InstalledRuntimeRegistryGeneratorDependencies,
): Promise<readonly RenderedPluginRegistry[]> {
  const generator = manifest.runtimeRegistryGenerator;
  if (!generator || generator.inspectionProtocol !== 2) {
    throw new Error('Byte inspection protocol 2 required.');
  }
  const targets = manifest.runtimeRegistries ?? [];
  if (targets.length > MAX_OUTPUTS) throw new Error('Plugin target capacity exceeded.');
  const declared = new Set<string>();
  for (const target of targets) {
    if (
      !isPluginOutputPath(target.registryPath) || declared.has(target.registryPath.toLowerCase())
    ) {
      throw new Error('Plugin producer overlap or authored output ownership violation.');
    }
    declared.add(target.registryPath.toLowerCase());
    await rejectInspectionLinks(projectRoot, target.registryPath);
    for (const directory of [target, ...(target.pluginDirs ?? [])]) {
      if (!isProjectPath(directory.dir)) throw new Error('Invalid plugin source directory.');
      await rejectInspectionLinks(projectRoot, directory.dir);
    }
  }
  await validateInspectionDirectories(
    projectRoot,
    targets.flatMap((target) => [
      target.dir,
      ...(target.pluginDirs ?? []).map((directory) => directory.dir),
    ]),
  );
  const command = resolved.generatorBase.startsWith('https:')
    ? new URL(generator.command, resolved.generatorBase).href
    : join(resolved.generatorBase, generator.command);
  const result = await dependencies.process.exec('deno', [
    'run',
    '--config',
    join(projectRoot, 'deno.json'),
    ...await inspectionLockArgs(projectRoot, dependencies),
    '--no-prompt',
    '--allow-read',
    '--deny-write',
    '--deny-run',
    '--deny-net',
    '--deny-env',
    '--deny-ffi',
    '--deny-sys',
    command,
    '--project-root',
    projectRoot,
    ...(generator.args ?? []),
    '--official-samples',
    'false',
    '--inspect',
    '--inspection-protocol',
    '2',
    '--manifest-json',
    JSON.stringify(manifest.raw),
  ], { cwd: projectRoot, timeoutMs: 30_000, maxOutputBytes: MAX_CONTENT });
  if (result.code !== 0) {
    throw new Error(
      `Plugin byte inspection failed for ${installed.name}: ${
        result.stderr.trim() || `exit ${result.code}`
      }`,
    );
  }
  if (result.stdout.length > MAX_CONTENT) {
    throw new Error('Plugin inspection response capacity exceeded.');
  }
  const document = strictRecord(JSON.parse(result.stdout), ['inspectionProtocol', 'registries']);
  if (
    document.inspectionProtocol !== 2 || !Array.isArray(document.registries) ||
    document.registries.length !== targets.length
  ) {
    throw new Error('Invalid or incomplete plugin byte inspection response.');
  }
  const reported = new Set<string>();
  const rendered: RenderedPluginRegistry[] = [];
  for (const raw of document.registries) {
    const entry = strictRecord(raw, ['registryPath', 'sourceFiles', 'content']);
    if (
      typeof entry.registryPath !== 'string' || !isPluginOutputPath(entry.registryPath) ||
      !targets.some((target) => target.registryPath === entry.registryPath) ||
      reported.has(entry.registryPath.toLowerCase())
    ) {
      throw new Error('Unknown or overlapping plugin registry producer.');
    }
    reported.add(entry.registryPath.toLowerCase());
    if (
      !Array.isArray(entry.sourceFiles) || entry.sourceFiles.length > MAX_SOURCES ||
      (entry.content !== null &&
        (typeof entry.content !== 'string' || entry.content.length > MAX_CONTENT))
    ) {
      throw new Error('Invalid plugin rendered content or source evidence.');
    }
    const sources = new Set<string>();
    for (const path of entry.sourceFiles) {
      if (
        typeof path !== 'string' || !isProjectPath(path) ||
        path.startsWith('.netscript/generated/') || sources.has(path.toLowerCase())
      ) {
        throw new Error('Invalid or overlapping authored plugin source.');
      }
      if (!await readInspectionFile(projectRoot, path)) {
        throw new Error('Missing selected plugin source.');
      }
      sources.add(path.toLowerCase());
    }
    rendered.push({
      path: entry.registryPath,
      plugin: installed.name,
      sourceFiles: entry.sourceFiles,
      content: entry.content,
    });
  }
  return rendered;
}

/** Reserved registry namespace; authored authorities cannot be claimed by a producer. */
export function isPluginOutputPath(path: string): boolean {
  return isProjectPath(path) && /^\.netscript\/generated\/[^/]+\/.+\.(?:ts|mts|js|mjs)$/.test(path);
}

/** Canonical relative paths avoid traversal, URLs, Windows aliases and case ambiguity. */
export function isProjectPath(path: string): boolean {
  return path.length > 0 && !/[\\:*?"<>|#]/.test(path) &&
    !Array.from(path).some((character) => character.charCodeAt(0) < 32) &&
    path.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..' && !/[. ]$/.test(part)
    );
}

/** Exact producer marker participates in the byte digest. */
export function pluginSurfaceMarker(plugin: string): string {
  return `// @netscript-generated ${PLUGIN_SURFACE_GENERATOR}:${plugin}\n`;
}

/** Reuse the shared generated-source canonicalizer before generation or inspection. */
export async function canonicalizePluginOutputs(
  projectRoot: string,
  rendered: readonly RenderedPluginRegistry[],
  formatter: GeneratedSourceFormatterPort,
): Promise<readonly (RenderedPluginRegistry & { readonly content: string })[]> {
  if (rendered.length > MAX_OUTPUTS) throw new Error('Plugin output capacity exceeded.');
  const paths = new Set<string>();
  let size = 0;
  const selected: (RenderedPluginRegistry & { readonly content: string })[] = [];
  for (const file of rendered) {
    if (!isPluginOutputPath(file.path) || paths.has(file.path.toLowerCase())) {
      throw new Error('Plugin producer overlap or authored output ownership violation.');
    }
    paths.add(file.path.toLowerCase());
    if (file.content === null) continue;
    if ((size += file.content.length) > MAX_CONTENT) {
      throw new Error('Plugin content capacity exceeded.');
    }
    selected.push({ ...file, content: pluginSurfaceMarker(file.plugin) + file.content });
  }
  const contents = await formatter.formatContents(
    selected.map((file) => ({ targetPath: join(projectRoot, file.path), content: file.content })),
  );
  if (contents.length !== selected.length) throw new Error('Incomplete plugin formatting batch.');
  return selected.map((file, index) => ({ ...file, content: contents[index] }));
}

function strictRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid plugin inspection object.');
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== keys.length || !keys.every((key) => Object.hasOwn(record, key))
  ) throw new Error('Invalid plugin inspection fields.');
  return record;
}

async function inspectionLockArgs(
  projectRoot: string,
  dependencies: InstalledRuntimeRegistryGeneratorDependencies,
): Promise<readonly string[]> {
  const config = parseJsonc(
    await dependencies.fs.readFile(join(projectRoot, 'deno.json')),
  ) as Record<string, unknown>;
  if (config.lock === false) return ['--no-lock'];
  const path = typeof config.lock === 'string' ? config.lock : 'deno.lock';
  if (!isProjectPath(path)) throw new Error('Invalid consumer lock path.');
  await rejectInspectionLinks(projectRoot, path);
  return await dependencies.fs.exists(join(projectRoot, path)) ? ['--frozen'] : ['--no-lock'];
}
