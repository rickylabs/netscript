import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import { basename, dirname, isAbsolute, join, relative, resolve } from '@std/path';
import {
  discoverInstalledRuntimePackages,
  type InstalledRuntimePackage,
  type InstalledRuntimeRegistryGeneratorDependencies,
  readRuntimeManifest,
  resolveRuntimeManifest,
  type RuntimeRegistryDirectory,
  type RuntimeRegistryGeneratorDeclaration,
  type RuntimeRegistryTarget,
} from './runtime-registry-manifests.ts';
export type {
  FetchRuntimeManifest,
  InstalledRuntimeRegistryGeneratorDependencies,
  RuntimeManifestResponse,
} from './runtime-registry-manifests.ts';
import { DenoGeneratedSourceFormatter } from '../../../../kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import {
  canonicalizePluginOutputs,
  renderRuntimeRegistryPlan,
} from './plugin-registry-renderer.ts';
import {
  EmptyPluginRegistryError,
  type GeneratedPluginRegistry,
  type GenerateInstalledPluginRegistries,
} from './generate-installed-plugin-registries.ts';

/** Create the manifest-driven installed-plugin registry generator. */
export function createInstalledRuntimeRegistryGenerator(
  dependencies: InstalledRuntimeRegistryGeneratorDependencies,
): GenerateInstalledPluginRegistries {
  return async (input) => {
    const packages = await discoverInstalledRuntimePackages(input.projectRoot, dependencies.fs);
    const generated: GeneratedPluginRegistry[] = [];

    const rendered = [];
    const legacy = [];
    const outputOwners = new Set<string>();
    for (const installed of packages) {
      const resolvedManifest = await resolveRuntimeManifest(
        input.projectRoot,
        installed,
        dependencies,
      );
      if (!resolvedManifest) continue;
      const manifest = readRuntimeManifest(resolvedManifest.value, installed.name);
      const generator = manifest.runtimeRegistryGenerator;
      const targets = manifest.runtimeRegistries;
      if (!generator || !targets?.length) continue;
      for (const target of targets) {
        const path = target.registryPath.toLowerCase();
        if (outputOwners.has(path)) throw new Error('Plugin registry producer overlap.');
        outputOwners.add(path);
      }
      if (generator.inspectionProtocol === 2) {
        const files = await renderRuntimeRegistryPlan(
          input.projectRoot,
          installed,
          resolvedManifest,
          manifest,
          dependencies,
        );
        rendered.push(...files);
        continue;
      }

      const selectedTargets = input.dryRun && generator.inspectionProtocolDeclared
        ? await inspectRuntimeRegistrySources({
          dependencies,
          generator,
          generatorBase: resolvedManifest.generatorBase,
          installed,
          projectRoot: input.projectRoot,
          rawManifest: manifest.raw,
          targets,
        })
        : await Promise.all(targets.map(async (target) => ({
          sourceFiles: await discoverRegistrableSourceFiles(
            input.projectRoot,
            target,
            dependencies.fs,
          ),
          target,
        })));
      const itemCount = selectedTargets.reduce(
        (count, target) => count + target.sourceFiles.length,
        0,
      );
      if (itemCount === 0) throw new EmptyPluginRegistryError(installed.name);

      generated.push(...selectedTargets.map(({ sourceFiles, target }) => ({
        path: target.registryPath,
        plugin: installed.name,
        registrableItems: sourceFiles.length,
        ...(input.dryRun
          ? {
            sourceAuthority: generator.inspectionProtocolDeclared
              ? 'generator' as const
              : 'manifest' as const,
            sourceFiles,
          }
          : {}),
      })));
      if (input.dryRun) continue;

      legacy.push(async () => {
        await runGenerator({
          dependencies,
          installed,
          generator,
          generatorBase: resolvedManifest.generatorBase,
          projectRoot: input.projectRoot,
          rawManifest: manifest.raw,
          targets,
        });
        for (const target of targets) {
          const outputPath = join(input.projectRoot, target.registryPath);
          if (!await dependencies.fs.exists(outputPath)) {
            throw new Error(
              `Installed plugin "${installed.name}" did not write declared registry ${target.registryPath}.`,
            );
          }
        }
      });
    }
    const canonical = await canonicalizePluginOutputs(
      input.projectRoot,
      rendered,
      new DenoGeneratedSourceFormatter(dependencies.process),
    );
    for (const file of rendered) {
      if (!input.dryRun && file.content === null) continue;
      generated.push({
        path: file.path,
        plugin: file.plugin,
        registrableItems: file.sourceFiles.length,
        ...(input.dryRun
          ? { sourceAuthority: 'generator' as const, sourceFiles: file.sourceFiles }
          : {}),
      });
    }
    if (!input.dryRun) {
      for (const file of canonical) {
        await dependencies.fs.writeFile(join(input.projectRoot, file.path), file.content);
      }
      for (const write of legacy) await write();
    }

    return generated;
  };
}

async function discoverRegistrableSourceFiles(
  projectRoot: string,
  target: RuntimeRegistryTarget,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const files = new Set(await discoverDirectoryFiles(projectRoot, target, fs));
  for (const pluginDir of target.pluginDirs ?? []) {
    for (const file of await discoverDirectoryFiles(projectRoot, pluginDir, fs)) {
      files.add(file);
    }
  }
  return [...files].sort((left, right) => left.localeCompare(right));
}

async function discoverDirectoryFiles(
  projectRoot: string,
  directory: RuntimeRegistryDirectory,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const absolute = join(projectRoot, directory.dir);
  if (!await fs.exists(absolute)) return [];
  const suffixes = directory.fileSuffixes ?? ['.ts'];
  const excluded = new Set(directory.exclude ?? []);
  return (await fs.readDir(absolute))
    .filter((entry) =>
      entry.isFile && !excluded.has(entry.name) &&
      suffixes.some((suffix) => entry.name.endsWith(suffix))
    )
    .map((entry) => normalizeProjectPath(relative(projectRoot, join(absolute, entry.name))));
}

function normalizeProjectPath(path: string): string {
  return path.replaceAll('\\', '/');
}

async function inspectRuntimeRegistrySources(options: {
  readonly dependencies: InstalledRuntimeRegistryGeneratorDependencies;
  readonly generator: RuntimeRegistryGeneratorDeclaration;
  readonly generatorBase: string;
  readonly installed: InstalledRuntimePackage;
  readonly projectRoot: string;
  readonly rawManifest: unknown;
  readonly targets: readonly RuntimeRegistryTarget[];
}): Promise<
  readonly { readonly sourceFiles: readonly string[]; readonly target: RuntimeRegistryTarget }[]
> {
  const fail = (reason: string): never => {
    throw new Error(
      `Generator inspection protocol 1 failed for ${options.installed.name}: ${reason}`,
    );
  };
  if (options.generator.inspectionProtocol !== 1) {
    fail('manifest inspectionProtocol must be the integer 1');
  }

  const declaredPaths = new Set<string>();
  for (const target of options.targets) {
    if (!isCanonicalProjectPath(target.registryPath)) {
      fail(`manifest registry path is invalid: ${target.registryPath}`);
    }
    if (declaredPaths.has(target.registryPath)) {
      fail(`manifest declares duplicate registry path: ${target.registryPath}`);
    }
    declaredPaths.add(target.registryPath);
  }

  let result: Awaited<ReturnType<ProcessPort['exec']>>;
  try {
    result = await options.dependencies.process.exec('deno', [
      'run',
      '--config',
      join(options.projectRoot, 'deno.json'),
      '--allow-read',
      resolveGeneratorUrl(options.generatorBase, options.generator.command),
      '--project-root',
      options.projectRoot,
      ...(options.generator.args ?? []),
      '--official-samples',
      'false',
      '--inspect',
      '--inspection-protocol',
      '1',
      '--manifest-json',
      JSON.stringify(options.rawManifest),
    ], { cwd: options.projectRoot });
  } catch (error) {
    throw fail(
      `generator process failed to start: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (result.code !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    fail(`generator exited ${result.code}${detail ? `: ${detail}` : ''}`);
  }

  let value: unknown;
  try {
    value = JSON.parse(result.stdout.trim());
  } catch {
    fail('stdout is not one protocol 1 JSON document');
  }
  const document = readStrictRecord(value, ['inspectionProtocol', 'registries'], 'document', fail);
  if (document.inspectionProtocol !== 1) {
    fail('invalid protocol 1 response: inspectionProtocol must equal 1');
  }
  const registries = Array.isArray(document.registries)
    ? document.registries
    : fail('invalid protocol 1 response: registries must be an array');

  const reported = new Map<string, readonly string[]>();
  for (const [index, rawEntry] of registries.entries()) {
    const entry = readStrictRecord(
      rawEntry,
      ['registryPath', 'sourceFiles'],
      `registries[${index}]`,
      fail,
    );
    const registryPath = typeof entry.registryPath === 'string'
      ? entry.registryPath
      : fail(`invalid protocol 1 response: registryPath is invalid at registries[${index}]`);
    if (!isCanonicalProjectPath(registryPath)) {
      fail(`invalid protocol 1 response: registryPath is invalid at registries[${index}]`);
    }
    if (reported.has(registryPath)) {
      fail(`response duplicated registry path: ${registryPath}`);
    }
    if (!declaredPaths.has(registryPath)) {
      fail(`response declared unknown registry path: ${registryPath}`);
    }
    const sourceFiles = Array.isArray(entry.sourceFiles)
      ? entry.sourceFiles
      : fail(`invalid protocol 1 response: sourceFiles must be an array for ${registryPath}`);

    const sources = new Set<string>();
    for (const source of sourceFiles) {
      const sourcePath = typeof source === 'string'
        ? source
        : fail(`response source path is invalid for ${registryPath}: ${String(source)}`);
      if (!isCanonicalProjectPath(sourcePath)) {
        fail(`response source path is invalid for ${registryPath}: ${sourcePath}`);
      }
      if (sources.has(sourcePath)) {
        fail(`response duplicated source for ${registryPath}: ${sourcePath}`);
      }
      const absoluteSource = resolve(options.projectRoot, sourcePath);
      let isRegularFile = false;
      try {
        isRegularFile = await options.dependencies.fs.exists(absoluteSource) &&
          (await options.dependencies.fs.stat(absoluteSource)).isFile;
      } catch {
        // Treat a disappearing or unreadable source as an invalid report, preserving fail-closed
        // inspection rather than leaking a filesystem-shaped error through the doctor surface.
      }
      if (!isRegularFile) {
        fail(`response source is not a regular project file for ${registryPath}: ${sourcePath}`);
      }
      sources.add(sourcePath);
    }
    reported.set(registryPath, [...sources].sort((left, right) => left.localeCompare(right)));
  }

  for (const path of declaredPaths) {
    if (!reported.has(path)) fail(`response omitted declared registry path: ${path}`);
  }
  return options.targets.map((target) => ({
    sourceFiles: reported.get(target.registryPath) ?? [],
    target,
  }));
}

function readStrictRecord(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
  fail: (reason: string) => never,
): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return fail(`invalid protocol 1 response: ${label} must be an object`);
  }
  const record = Object(value) as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const expected = [...expectedKeys].sort();
  if (
    actualKeys.length !== expected.length ||
    actualKeys.some((key, index) => key !== expected[index])
  ) {
    return fail(
      `invalid protocol 1 response: ${label} must contain exactly ${expected.join(', ')}`,
    );
  }
  return record;
}

function isCanonicalProjectPath(value: string): boolean {
  if (
    value.length === 0 || value.includes('\\') || value.includes('?') || value.includes('#') ||
    isAbsolute(value) || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)
  ) {
    return false;
  }
  return value.split('/').every((segment) =>
    segment.length > 0 && segment !== '.' && segment !== '..'
  );
}

function resolveGeneratorUrl(generatorBase: string, command: string): string {
  return generatorBase.startsWith('https:')
    ? new URL(command, generatorBase).href
    : join(generatorBase, command);
}

async function runGenerator(options: {
  readonly dependencies: InstalledRuntimeRegistryGeneratorDependencies;
  readonly installed: InstalledRuntimePackage;
  readonly generator: RuntimeRegistryGeneratorDeclaration;
  readonly generatorBase: string;
  readonly projectRoot: string;
  readonly rawManifest: unknown;
  readonly targets: readonly RuntimeRegistryTarget[];
}): Promise<void> {
  const manifestPath = join(
    options.projectRoot,
    '.netscript',
    '.runtime-manifests',
    `${safeName(options.installed.packageName)}.json`,
  );
  await options.dependencies.fs.writeFile(manifestPath, `${JSON.stringify(options.rawManifest)}\n`);
  try {
    const result = await options.dependencies.process.exec('deno', [
      'run',
      '--config',
      join(options.projectRoot, 'deno.json'),
      '--allow-read',
      '--allow-write',
      resolveGeneratorUrl(options.generatorBase, options.generator.command),
      '--project-root',
      options.projectRoot,
      '--manifest',
      manifestPath,
      ...(options.generator.args ?? []),
      '--official-samples',
      'false',
    ], { cwd: options.projectRoot });
    if (result.code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim();
      throw new Error(
        `Runtime registry generator failed for "${options.installed.name}" (exit ${result.code})${
          detail ? `: ${detail}` : '.'
        }`,
      );
    }
  } finally {
    if (await options.dependencies.fs.exists(manifestPath)) {
      await options.dependencies.fs.remove(manifestPath);
      const parent = dirname(manifestPath);
      if ((await options.dependencies.fs.readDir(parent)).length === 0) {
        await options.dependencies.fs.remove(parent);
      }
    }
  }
}

function safeName(value: string): string {
  return basename(value).replaceAll(/[^a-zA-Z0-9._-]/g, '-');
}

function readStrings(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? Object(value) : {};
}
