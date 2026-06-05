import { exists } from 'jsr:@std/fs@^1';
import { basename, dirname, join, relative } from 'jsr:@std/path@^1';
import { toCamelCase } from 'jsr:@std/text@^1';

export interface GenerateRuntimeRegistriesOptions {
  readonly manifestPath: string;
  readonly profile?: string;
  readonly projectRoot: string;
}

interface RuntimeManifest {
  readonly runtimeRegistries?: readonly RuntimeRegistryTarget[];
}

interface RuntimeRegistryTarget {
  readonly kind: 'map' | 'workers-job';
  readonly dir: string;
  readonly registryPath?: string;
  readonly fileSuffixes: readonly string[];
  readonly include?: readonly string[];
  readonly includeWhenPresent?: readonly ConditionalRuntimeInclude[];
  readonly exclude: readonly string[];
  readonly registryKey: string;
  readonly varPrefix: string;
  readonly typeImport: TypeImport;
  readonly mapValueType?: string;
  readonly preamble?: readonly string[];
  readonly pluginDirs?: readonly RegistryPluginDir[];
  readonly profiles?: Readonly<Record<string, RuntimeRegistryProfile>>;
}

interface RuntimeRegistryProfile {
  readonly include?: readonly string[];
  readonly includeWhenPresent?: readonly ConditionalRuntimeInclude[];
}

interface TypeImport {
  readonly name: string;
  readonly from: string;
}

interface RegistryPluginDir {
  readonly dir: string;
  readonly importPrefix: string;
  readonly label: string;
  readonly pluginId: string;
  readonly varPrefix: string;
  readonly exclude?: readonly string[];
}

interface ConditionalRuntimeInclude {
  readonly dir: string;
  readonly files: readonly string[];
}

interface PluginEntry {
  readonly file: string;
  readonly pluginId: string;
  readonly registryKey: string;
  readonly varName: string;
}

export async function generateRuntimeRegistries(
  options: GenerateRuntimeRegistriesOptions,
): Promise<readonly string[]> {
  const manifest = JSON.parse(await Deno.readTextFile(options.manifestPath)) as RuntimeManifest;
  const generated: string[] = [];

  for (const rawTarget of manifest.runtimeRegistries ?? []) {
    const target = applyProfile(rawTarget, options.profile);
    const targetDir = join(options.projectRoot, target.dir);
    if (!await exists(targetDir, { isDirectory: true })) {
      continue;
    }

    const files = await discoverRegistryFiles(options.projectRoot, targetDir, {
      fileSuffixes: target.fileSuffixes,
      include: target.include,
      includeWhenPresent: target.includeWhenPresent,
      exclude: target.exclude,
    });
    if (files.length === 0) {
      continue;
    }

    const registryPath = target.registryPath
      ? join(options.projectRoot, target.registryPath)
      : join(targetDir, '_registry.ts');
    await Deno.mkdir(dirname(registryPath), { recursive: true });
    await Deno.writeTextFile(
      registryPath,
      await generateRuntimeRegistry(options.projectRoot, target, registryPath, files),
    );
    generated.push(relative(options.projectRoot, registryPath).replaceAll('\\', '/'));
  }

  return Object.freeze(generated);
}

function applyProfile(
  target: RuntimeRegistryTarget,
  profile: string | undefined,
): RuntimeRegistryTarget {
  const overlay = profile ? target.profiles?.[profile] : undefined;
  if (!overlay) return target;
  return {
    ...target,
    include: overlay.include ?? target.include,
    includeWhenPresent: overlay.includeWhenPresent ?? target.includeWhenPresent,
  };
}

async function discoverRegistryFiles(
  projectRoot: string,
  dir: string,
  options: {
    readonly fileSuffixes: readonly string[];
    readonly include?: readonly string[];
    readonly includeWhenPresent?: readonly ConditionalRuntimeInclude[];
    readonly exclude: readonly string[];
  },
): Promise<string[]> {
  const include = await resolveRuntimeIncludes(projectRoot, options);
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (
      entry.isFile &&
      !entry.name.startsWith('.') &&
      !options.exclude.includes(entry.name) &&
      (!include || include.has(entry.name)) &&
      options.fileSuffixes.some((suffix) => entry.name.endsWith(suffix))
    ) {
      files.push(entry.name);
    }
  }
  return files.sort();
}

async function resolveRuntimeIncludes(
  projectRoot: string,
  options: {
    readonly include?: readonly string[];
    readonly includeWhenPresent?: readonly ConditionalRuntimeInclude[];
  },
): Promise<Set<string> | null> {
  if (!options.include && !options.includeWhenPresent) {
    return null;
  }

  const include = new Set(options.include ?? []);
  for (const conditional of options.includeWhenPresent ?? []) {
    if (await exists(join(projectRoot, conditional.dir), { isDirectory: true })) {
      conditional.files.forEach((file) => include.add(file));
    }
  }

  return include;
}

async function generateRuntimeRegistry(
  projectRoot: string,
  target: RuntimeRegistryTarget,
  registryPath: string,
  files: readonly string[],
): Promise<string> {
  const lines = createRegistryHeader(target);
  const registryDir = relative(projectRoot, dirname(registryPath)).replaceAll('\\', '/');
  files.forEach((file, index) => {
    lines.push(
      `import ${target.varPrefix}${index} from '${
        toRelativeImport(registryDir, `${target.dir}/${file}`)
      }';`,
    );
  });

  const pluginEntries = await appendPluginImports(projectRoot, target, registryDir, lines);
  const valueType = target.mapValueType ?? target.typeImport.name;
  lines.push('', `export const registry = new Map<string, ${valueType}>([`);
  files.forEach((_file, index) => {
    lines.push(
      `  [${target.varPrefix}${index}.${target.registryKey}, ${target.varPrefix}${index}],`,
    );
  });
  pluginEntries.forEach((entry) => {
    lines.push(`  [${entry.varName}.${entry.registryKey}, ${entry.varName}],`);
  });
  lines.push(']);', '');

  appendJobDefinitions(target, files, pluginEntries, lines);
  return lines.join('\n');
}

function createRegistryHeader(target: RuntimeRegistryTarget): string[] {
  return [
    ...(target.preamble ?? []),
    '/**',
    ` * ${toExportName(target.varPrefix)} Registry - AUTO-GENERATED`,
    ' *',
    ' * DO NOT EDIT - regenerated by the workers plugin CLI.',
    ' *',
    ' * @module',
    ' */',
    '',
    target.kind === 'workers-job'
      ? `import type { ${target.typeImport.name}, RegisterJobInput } from '${target.typeImport.from}';`
      : `import type { ${target.typeImport.name} } from '${target.typeImport.from}';`,
    '',
  ];
}

async function appendPluginImports(
  projectRoot: string,
  target: RuntimeRegistryTarget,
  registryDir: string,
  lines: string[],
): Promise<PluginEntry[]> {
  const pluginEntries: PluginEntry[] = [];
  for (const pluginDir of target.pluginDirs ?? []) {
    const dir = join(projectRoot, pluginDir.dir);
    if (!await exists(dir, { isDirectory: true })) {
      continue;
    }

    const pluginFiles = await discoverRegistryFiles(projectRoot, dir, {
      fileSuffixes: target.fileSuffixes,
      exclude: pluginDir.exclude ?? [],
    });
    if (pluginFiles.length === 0) {
      continue;
    }

    lines.push(
      '',
      '// ' + '='.repeat(74),
      `// STATIC IMPORTS: ${pluginDir.label}`,
      '// ' + '='.repeat(74),
      '',
    );
    for (const file of pluginFiles) {
      const varName = `${pluginDir.varPrefix}${toExportName(basename(file, '.ts'))}Handler`;
      lines.push(
        `import ${varName} from '${toRelativeImport(registryDir, `${pluginDir.dir}/${file}`)}';`,
      );
      pluginEntries.push({
        file,
        pluginId: pluginDir.pluginId,
        registryKey: target.registryKey,
        varName,
      });
    }
  }
  return pluginEntries;
}

function appendJobDefinitions(
  target: RuntimeRegistryTarget,
  files: readonly string[],
  pluginEntries: readonly PluginEntry[],
  lines: string[],
): void {
  if (target.kind !== 'workers-job') return;

  lines.push('const jobDefinitionEntries: readonly [string, RegisterJobInput][] = [');
  files.forEach((file, index) => {
    lines.push(
      `  [${target.varPrefix}${index}.${target.registryKey}, createLocalJobDefinition(${target.varPrefix}${index}.${target.registryKey}, './${file}')],`,
    );
  });
  pluginEntries.forEach((entry) => {
    lines.push(
      `  [${entry.varName}.id, createPluginJobDefinition(${entry.varName}.id, '${entry.pluginId}', './plugins/${entry.pluginId}/jobs/${entry.file}')],`,
    );
  });
  lines.push('];', '');
  lines.push(
    'export const jobDefinitions = new Map<string, RegisterJobInput>(jobDefinitionEntries);',
  );
  lines.push('export const definitions = jobDefinitions;', '');
  lines.push(
    'function createLocalJobDefinition(id: string, entrypoint: string): RegisterJobInput {',
  );
  lines.push('  return createJobDefinition(id, entrypoint, "local");');
  lines.push('}', '');
  lines.push(
    'function createPluginJobDefinition(id: string, pluginId: string, entrypoint: string): RegisterJobInput {',
  );
  lines.push('  return createJobDefinition(id, entrypoint, "plugin", pluginId);');
  lines.push('}', '');
  lines.push(
    'function createJobDefinition(id: string, entrypoint: string, source: "local" | "plugin", pluginId?: string): RegisterJobInput {',
  );
  lines.push('  return {');
  lines.push('    id,');
  lines.push('    name: toJobName(id),');
  lines.push('    entrypoint,');
  lines.push('    topic: "default",');
  lines.push('    source,');
  lines.push('    ...(pluginId ? { pluginId } : {}),');
  lines.push('    executionType: "deno",');
  lines.push('    timezone: "UTC",');
  lines.push('    timeout: 300000,');
  lines.push('    maxRetries: 3,');
  lines.push('    retryDelay: 1000,');
  lines.push('    maxConcurrency: 1,');
  lines.push('    priority: 50,');
  lines.push('    enabled: true,');
  lines.push('    persist: true,');
  lines.push('    tags: source === "plugin" ? ["plugin", pluginId ?? "unknown"] : [],');
  lines.push('  };');
  lines.push('}', '');
  lines.push('function toJobName(id: string): string {');
  lines.push('  return id.split("-").filter(Boolean).map((part) =>');
  lines.push('    `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`');
  lines.push('  ).join(" ");');
  lines.push('}', '');
}

function toRelativeImport(fromDir: string, target: string): string {
  const specifier = relative(fromDir, target).replace(/\\/g, '/');
  return specifier.startsWith('.') ? specifier : `./${specifier}`;
}

function toExportName(value: string): string {
  const camel = toCamelCase(value);
  return `${camel[0]?.toUpperCase() ?? ''}${camel.slice(1)}`;
}
