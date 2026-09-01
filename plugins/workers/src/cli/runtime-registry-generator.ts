import { exists } from 'jsr:@std/fs@^1';
import { basename, dirname, join, relative, resolve } from 'jsr:@std/path@^1';
import { toCamelCase } from 'jsr:@std/text@^1';
import type { JobConfig, WorkersConfigData } from '@netscript/plugin-workers-core/config';

export interface GenerateRuntimeRegistriesOptions {
  readonly manifestPath: string;
  readonly profile?: string;
  readonly projectRoot: string;
  /** Core-normalized project workers policy, when the project declares one. */
  readonly workers?: WorkersConfigData;
}

type RuntimeManifest = Readonly<{ runtimeRegistries?: readonly RuntimeRegistryTarget[] }>;

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
  readonly path: string;
  readonly pluginId: string;
  readonly registryKey: string;
  readonly varName: string;
}

type DiscoveredJob = Readonly<{ path: string; source: 'local' | 'plugin' }>;

interface ConfiguredJob {
  readonly canonicalPath: string;
  readonly grouped: boolean;
  readonly origin: string;
  readonly policy: JobConfig;
}

export async function generateRuntimeRegistries(
  options: GenerateRuntimeRegistriesOptions,
): Promise<readonly string[]> {
  const manifest = JSON.parse(await Deno.readTextFile(options.manifestPath)) as RuntimeManifest;
  const generated: string[] = [];
  for (const rawTarget of manifest.runtimeRegistries ?? []) {
    const target = applyProfile(rawTarget, options.profile);
    const targetDir = join(options.projectRoot, target.dir);
    const hasConfiguredJobs = target.kind === 'workers-job' && options.workers &&
      (options.workers.jobs.length > 0 ||
        options.workers.groups.some((group) => group.jobs.length));
    const targetDirExists = await exists(targetDir, { isDirectory: true });
    if (!targetDirExists && !hasConfiguredJobs) continue;

    const files = targetDirExists
      ? await discoverRegistryFiles(options.projectRoot, targetDir, {
        fileSuffixes: target.fileSuffixes,
        include: target.include,
        includeWhenPresent: target.includeWhenPresent,
        exclude: target.exclude,
      })
      : [];
    if (files.length === 0 && !hasConfiguredJobs) continue;

    const registryPath = target.registryPath
      ? join(options.projectRoot, target.registryPath)
      : join(targetDir, '_registry.ts');
    await Deno.mkdir(dirname(registryPath), { recursive: true });
    await Deno.writeTextFile(
      registryPath,
      await generateRuntimeRegistry(
        options.projectRoot,
        target,
        registryPath,
        files,
        options.workers,
      ),
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
  workers: WorkersConfigData | undefined,
): Promise<string> {
  const lines = createRegistryHeader(target);
  const registryDir = relative(projectRoot, dirname(registryPath)).replaceAll('\\', '/');
  files.forEach((file, index) => {
    const alias = `${target.varPrefix}${index}`;
    const importBinding = target.kind === 'workers-job' ? `* as ${alias}` : alias;
    lines.push(
      `import ${importBinding} from '${toRelativeImport(registryDir, `${target.dir}/${file}`)}';`,
    );
  });

  const pluginEntries = await appendPluginImports(projectRoot, target, registryDir, lines);
  const configuredPolicies = target.kind === 'workers-job' && workers
    ? resolveConfiguredJobPolicies(projectRoot, target, files, pluginEntries, workers)
    : undefined;
  const valueType = target.mapValueType ?? target.typeImport.name;
  if (target.kind === 'workers-job') {
    lines.push('', `const jobHandlers: readonly ${valueType}[] = [`);
    files.forEach((file, index) => {
      lines.push(
        `  resolveJobHandler(${target.varPrefix}${index}, ${
          JSON.stringify(`${target.dir}/${file}`)
        }),`,
      );
    });
    pluginEntries.forEach((entry) => {
      lines.push(`  resolveJobHandler(${entry.varName}, ${JSON.stringify(entry.path)}),`);
    });
    lines.push('];', '', `export const registry = new Map<string, ${valueType}>([`);
    files.forEach((file, index) => {
      const path = `${target.dir}/${file}`;
      const policy = configuredPolicies?.get(path);
      lines.push(
        `  [${JSON.stringify(policy?.id ?? basename(file, '.ts'))}, jobHandlers[${index}]],`,
      );
    });
    pluginEntries.forEach((entry, index) => {
      const handlerIndex = files.length + index;
      const policy = configuredPolicies?.get(entry.path);
      lines.push(
        policy
          ? `  [assertJobHandlerId(jobHandlers[${handlerIndex}], ${JSON.stringify(policy.id)}, ${
            JSON.stringify(entry.path)
          }), jobHandlers[${handlerIndex}]],`
          : `  [jobHandlers[${handlerIndex}].${target.registryKey}, jobHandlers[${handlerIndex}]],`,
      );
    });
  } else {
    lines.push('', `export const registry = new Map<string, ${valueType}>([`);
    files.forEach((_file, index) => {
      lines.push(
        `  [${target.varPrefix}${index}.${target.registryKey}, ${target.varPrefix}${index}],`,
      );
    });
    pluginEntries.forEach((entry) => {
      lines.push(`  [${entry.varName}.${entry.registryKey}, ${entry.varName}],`);
    });
  }
  lines.push(']);', '');

  appendJobDefinitions(
    target,
    files,
    pluginEntries,
    configuredPolicies,
    lines,
  );
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
      const importBinding = target.kind === 'workers-job' ? `* as ${varName}` : varName;
      lines.push(
        `import ${importBinding} from '${
          toRelativeImport(registryDir, `${pluginDir.dir}/${file}`)
        }';`,
      );
      pluginEntries.push({
        file,
        path: `${pluginDir.dir}/${file}`,
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
  configuredPolicies: ReadonlyMap<string, JobConfig> | undefined,
  lines: string[],
): void {
  if (target.kind !== 'workers-job') return;

  let hasConfiguredPolicies = false;
  lines.push('const jobDefinitionEntries: readonly [string, RegisterJobInput][] = [');
  files.forEach((file) => {
    const policy = configuredPolicies?.get(`${target.dir}/${file}`);
    if (policy) {
      hasConfiguredPolicies = true;
      lines.push(configuredDefinitionEntry(policy, `./${file}`, 'local'));
    } else {
      const jobId = JSON.stringify(basename(file, '.ts'));
      lines.push(
        `  [${jobId}, createLocalJobDefinition(${jobId}, './${file}')],`,
      );
    }
  });
  pluginEntries.forEach((entry, index) => {
    const handlerIndex = files.length + index;
    const policy = configuredPolicies?.get(entry.path);
    if (policy) {
      hasConfiguredPolicies = true;
      lines.push(configuredDefinitionEntry(policy, `./${entry.path}`, 'plugin', entry.pluginId));
    } else {
      lines.push(
        `  [jobHandlers[${handlerIndex}].id, createPluginJobDefinition(jobHandlers[${handlerIndex}].id, '${entry.pluginId}', './plugins/${entry.pluginId}/jobs/${entry.file}')],`,
      );
    }
  });
  lines.push('];', '');
  lines.push(
    'export const jobDefinitions = new Map<string, RegisterJobInput>(jobDefinitionEntries);',
  );
  lines.push('export const definitions = jobDefinitions;', '');
  if (hasConfiguredPolicies) {
    lines.push(
      'function createConfiguredJobDefinition(policy: RegisterJobInput, entrypoint: string, source: "local" | "plugin", pluginId?: string): RegisterJobInput {\n  return {\n    ...policy,\n    entrypoint,\n    source,\n    ...(pluginId ? { pluginId } : {}),\n    executionType: "deno",\n  };\n}',
      '',
    );
  }
  lines.push(
    'function createLocalJobDefinition(id: string, entrypoint: string): RegisterJobInput {\n  return createJobDefinition(id, entrypoint, "local");\n}',
    '',
    'function createPluginJobDefinition(id: string, pluginId: string, entrypoint: string): RegisterJobInput {\n  return createJobDefinition(id, entrypoint, "plugin", pluginId);\n}',
    '',
    'function createJobDefinition(id: string, entrypoint: string, source: "local" | "plugin", pluginId?: string): RegisterJobInput {\n  return {\n    id,\n    name: toJobName(id),\n    entrypoint,\n    topic: "default",\n    source,\n    ...(pluginId ? { pluginId } : {}),\n    executionType: "deno",\n    timezone: "UTC",\n    timeout: 300000,\n    maxRetries: 3,\n    retryDelay: 1000,\n    maxConcurrency: 1,\n    priority: 50,\n    enabled: true,\n    persist: true,\n    tags: source === "plugin" ? ["plugin", pluginId ?? "unknown"] : [],\n  };\n}',
    '',
    'function toJobName(id: string): string {\n  return id.split("-").filter(Boolean).map((part) =>\n    `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`\n  ).join(" ");\n}',
    '',
  );
  const handlerType = target.mapValueType ?? target.typeImport.name;
  if (pluginEntries.some((entry) => configuredPolicies?.has(entry.path))) {
    lines.push(
      `function assertJobHandlerId(handler: ${handlerType}, expectedId: string, path: string): string {\n  if (handler.id !== expectedId) {\n    throw new Error(\`Workers config id "\${expectedId}" does not match discovered plugin handler id "\${String(handler.id)}" at \${path}.\`);\n  }\n  return expectedId;\n}`,
      '',
    );
  }
  lines.push(
    `function resolveJobHandler(module: Record<string, unknown>, path: string): ${handlerType} {\n  const candidate = module.default ?? module.handler ?? firstFunctionExport(module);\n  if (typeof candidate !== "function") {\n    throw new Error(\`Worker job module \${path} does not export a function handler.\`);\n  }\n  return candidate as ${handlerType};\n}`,
    '',
    'function firstFunctionExport(module: Record<string, unknown>): unknown {\n  return Object.values(module).find((value) => typeof value === "function");\n}',
    '',
  );
}

function resolveConfiguredJobPolicies(
  projectRoot: string,
  target: RuntimeRegistryTarget,
  files: readonly string[],
  pluginEntries: readonly PluginEntry[],
  workers: WorkersConfigData,
): ReadonlyMap<string, JobConfig> {
  const discovered = new Map<string, DiscoveredJob>();
  files.forEach((file) => addDiscovered(`${target.dir}/${file}`, 'local'));
  pluginEntries.forEach((entry) => addDiscovered(entry.path, 'plugin'));
  const configuredByPath = new Map<string, ConfiguredJob>();
  const configuredById = new Map<string, ConfiguredJob>();
  workers.groups.forEach((group, groupIndex) =>
    group.jobs.forEach((policy, jobIndex) =>
      addConfiguredJob(policy, `workers.groups[${groupIndex}].jobs[${jobIndex}]`, true)
    )
  );
  workers.jobs.forEach((policy, index) =>
    addConfiguredJob(policy, `workers.jobs[${index}]`, false)
  );

  const matched = new Map<string, JobConfig>();
  for (const configured of configuredByPath.values()) {
    const discoveredJob = discovered.get(configured.canonicalPath);
    if (!discoveredJob) {
      const available = [...discovered.values()].map((entry) => entry.path).join(', ') || '(none)';
      throw new Error(
        `Workers config ${configured.origin} declares id "${configured.policy.id}" at "${configured.policy.entrypoint}", which resolves to unmatched project path "${configured.canonicalPath}". Discovered worker job files: ${available}.`,
      );
    }
    if (configured.policy.source !== discoveredJob.source) {
      throw new Error(
        `Workers config ${configured.origin} declares source "${configured.policy.source}" for id "${configured.policy.id}" at "${configured.canonicalPath}", but discovery identified that file as source "${discoveredJob.source}".`,
      );
    }
    matched.set(discoveredJob.path, configured.policy);
  }
  return matched;

  function addDiscovered(path: string, source: 'local' | 'plugin'): void {
    const canonicalPath = canonicalProjectPath(projectRoot, path);
    discovered.set(canonicalPath, { path, source });
  }

  function addConfiguredJob(policy: JobConfig, origin: string, grouped: boolean): void {
    const canonicalPath = configuredProjectPath(projectRoot, workers.jobsDir, policy.entrypoint);
    const configured = { canonicalPath, grouped, origin, policy } satisfies ConfiguredJob;
    const samePath = configuredByPath.get(canonicalPath);
    if (samePath) {
      if (samePath.policy.id !== policy.id) {
        throw new Error(
          `Workers config path "${canonicalPath}" is paired with conflicting ids "${samePath.policy.id}" (${samePath.origin}) and "${policy.id}" (${origin}).`,
        );
      }
      if (!grouped && samePath.grouped) {
        console.warn(
          `Workers config ${samePath.origin} wholly shadows flat ${origin} for id "${policy.id}" at "${canonicalPath}".`,
        );
        return;
      }
      throw new Error(
        `Workers config contains duplicate policies for id "${policy.id}" at "${canonicalPath}" (${samePath.origin} and ${origin}).`,
      );
    }

    const sameId = configuredById.get(policy.id);
    if (sameId && sameId.canonicalPath !== canonicalPath) {
      throw new Error(
        `Workers config id "${policy.id}" is paired with conflicting paths "${sameId.canonicalPath}" (${sameId.origin}) and "${canonicalPath}" (${origin}).`,
      );
    }
    configuredByPath.set(canonicalPath, configured);
    configuredById.set(policy.id, configured);
  }
}

function configuredDefinitionEntry(
  policy: JobConfig,
  entrypoint: string,
  source: 'local' | 'plugin',
  pluginId?: string,
): string {
  const pluginArgument = pluginId ? `, ${JSON.stringify(pluginId)}` : '';
  return `  [${JSON.stringify(policy.id)}, createConfiguredJobDefinition(${
    JSON.stringify(policy)
  }, ${JSON.stringify(entrypoint)}, ${JSON.stringify(source)}${pluginArgument})],`;
}

function configuredProjectPath(projectRoot: string, jobsDir: string, entrypoint: string): string {
  const absoluteJobsDir = resolve(projectRoot, jobsDir.replaceAll('\\', '/'));
  return canonicalProjectPath(
    projectRoot,
    resolve(absoluteJobsDir, entrypoint.replaceAll('\\', '/')),
  );
}

function canonicalProjectPath(projectRoot: string, path: string): string {
  const absolute = resolve(projectRoot, path.replaceAll('\\', '/'));
  return relative(resolve(projectRoot), absolute).replaceAll('\\', '/');
}

function toRelativeImport(fromDir: string, target: string): string {
  const specifier = relative(fromDir, target).replace(/\\/g, '/');
  return specifier.startsWith('.') ? specifier : `./${specifier}`;
}

function toExportName(value: string): string {
  const camel = toCamelCase(value);
  return `${camel[0]?.toUpperCase() ?? ''}${camel.slice(1)}`;
}
