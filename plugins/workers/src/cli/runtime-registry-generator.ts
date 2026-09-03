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

interface GeneratedJobEntry {
  readonly key: string;
  readonly keyExpression: string;
  readonly moduleVariable: string;
  readonly path: string;
  readonly pluginId?: string;
  readonly policy?: JobConfig;
  readonly resolvedVariable: string;
  readonly source: 'local' | 'plugin';
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
    const jobEntries = createGeneratedJobEntries(
      target,
      files,
      pluginEntries,
      configuredPolicies,
    );
    appendLiteralJobHandlers(jobEntries, target.registryKey, lines);
    lines.push(
      '',
      'type StaticJobHandler = StaticJobRegistry extends ReadonlyMap<string, infer THandler>',
      '  ? THandler',
      '  : never;',
      '',
      'export const registry: StaticJobRegistry = new Map<string, StaticJobHandler>([',
    );
    jobEntries.forEach((entry) => {
      lines.push(`  [${entry.keyExpression}, jobHandlersById[${entry.keyExpression}]],`);
    });
    lines.push(']);', '');
    appendJobDefinitions(jobEntries, lines);
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
    lines.push(']);', '');
  }
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
      ? `import type { JobPayloadMap, RegisterJobInput, StaticJobRegistry } from '${target.typeImport.from}';`
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

function createGeneratedJobEntries(
  target: RuntimeRegistryTarget,
  files: readonly string[],
  pluginEntries: readonly PluginEntry[],
  configuredPolicies: ReadonlyMap<string, JobConfig> | undefined,
): GeneratedJobEntry[] {
  const entries: GeneratedJobEntry[] = files.map((file, index) => {
    const path = `${target.dir}/${file}`;
    const policy = configuredPolicies?.get(path);
    const key = policy?.id ?? basename(file, '.ts');
    return {
      key,
      keyExpression: JSON.stringify(key),
      moduleVariable: `${target.varPrefix}${index}`,
      path,
      policy,
      resolvedVariable: `resolvedJob${index}`,
      source: 'local',
    };
  });
  pluginEntries.forEach((entry, index) => {
    const policy = configuredPolicies?.get(entry.path);
    const resolvedVariable = `resolvedPluginJob${index}`;
    entries.push({
      key: policy?.id ?? '',
      keyExpression: policy
        ? `assertJobHandlerId(${resolvedVariable}, ${JSON.stringify(policy.id)}, ${
          JSON.stringify(entry.path)
        })`
        : `${resolvedVariable}.${target.registryKey}`,
      moduleVariable: entry.varName,
      path: entry.path,
      pluginId: entry.pluginId,
      policy,
      resolvedVariable,
      source: 'plugin',
    });
  });
  return entries;
}

function appendLiteralJobHandlers(
  entries: readonly GeneratedJobEntry[],
  registryKey: string,
  lines: string[],
): void {
  lines.push('');
  entries.forEach((entry) => {
    lines.push(
      `const ${entry.resolvedVariable}: ResolvedJobHandler<typeof ${entry.moduleVariable}> = resolveJobHandler(${entry.moduleVariable}, ${
        JSON.stringify(entry.path)
      });`,
    );
  });
  const fixed = entries.filter((entry) => entry.source === 'local' || entry.policy);
  const dynamic = entries.filter((entry) => entry.source === 'plugin' && !entry.policy);
  lines.push('', 'export type GeneratedJobHandlerRegistry =');
  lines.push('  & Readonly<{');
  fixed.forEach((entry) => {
    lines.push(`    readonly ${JSON.stringify(entry.key)}: typeof ${entry.resolvedVariable};`);
  });
  lines.push('  }>');
  dynamic.forEach((entry) => {
    lines.push(
      `  & Readonly<Record<typeof ${entry.resolvedVariable}.${registryKey}, typeof ${entry.resolvedVariable}>>`,
    );
  });
  lines.push(
    ';',
    '',
    'export const jobHandlersById: GeneratedJobHandlerRegistry = Object.freeze({',
  );
  entries.forEach((entry) => {
    lines.push(`  [${entry.keyExpression}]: ${entry.resolvedVariable},`);
  });
  lines.push('});');
}

function appendJobDefinitions(entries: readonly GeneratedJobEntry[], lines: string[]): void {
  lines.push(
    '',
    'type SchemaBackedJobHandler =',
    '  & ((...args: never[]) => unknown)',
    '  & Readonly<{ payloadSchema: unknown }>;',
    '',
    'type GeneratedJobDefinition<',
    '  TId extends string,',
    '  THandler extends SchemaBackedJobHandler,',
    '> = Readonly<RegisterJobInput & {',
    '  readonly id: TId;',
    '  readonly handler: THandler;',
    '  readonly payloadSchema: THandler["payloadSchema"];',
    '}>;',
    '',
    'export type GeneratedJobDefinitionRegistry = Readonly<{',
    '  [TId in keyof GeneratedJobHandlerRegistry]: GeneratedJobDefinition<',
    '    TId & string,',
    '    GeneratedJobHandlerRegistry[TId]',
    '  >;',
    '}>;',
    '',
    'export type GeneratedJobPayloadMap = JobPayloadMap<GeneratedJobDefinitionRegistry>;',
    '',
    'export const jobDefinitionsById: GeneratedJobDefinitionRegistry = Object.freeze({',
  );
  entries.forEach((entry) => {
    const entrypoint = entry.source === 'local'
      ? `./${basename(entry.path)}`
      : `./plugins/${entry.pluginId}/jobs/${basename(entry.path)}`;
    const call = entry.policy
      ? `createConfiguredJobDefinition(${JSON.stringify(entry.policy)}, ${
        JSON.stringify(entrypoint)
      }, ${JSON.stringify(entry.source)}, ${entry.resolvedVariable}${
        entry.pluginId ? `, ${JSON.stringify(entry.pluginId)}` : ''
      })`
      : entry.source === 'local'
      ? `createLocalJobDefinition(${JSON.stringify(entry.key)}, ${
        JSON.stringify(entrypoint)
      }, ${entry.resolvedVariable})`
      : `createPluginJobDefinition(${entry.keyExpression}, ${JSON.stringify(entry.pluginId)}, ${
        JSON.stringify(entrypoint)
      }, ${entry.resolvedVariable})`;
    lines.push(`  [${entry.keyExpression}]: ${call},`);
  });
  lines.push(
    '});',
    '',
    'const jobDefinitionEntries: readonly [string, RegisterJobInput][] = Object.entries(jobDefinitionsById)',
    '  .map(([id, definition]) => [id, toRegisterJobInput(definition)]);',
    '',
    'export const jobDefinitions: ReadonlyMap<string, RegisterJobInput> = new Map(jobDefinitionEntries);',
    'export const definitions: ReadonlyMap<string, RegisterJobInput> = jobDefinitions;',
    '',
    'function createConfiguredJobDefinition<TId extends string, THandler extends SchemaBackedJobHandler>(policy: RegisterJobInput & { readonly id: TId }, entrypoint: string, source: "local" | "plugin", handler: THandler, pluginId?: string): GeneratedJobDefinition<TId, THandler> {\n  return {\n    ...policy,\n    entrypoint,\n    source,\n    ...(pluginId ? { pluginId } : {}),\n    executionType: "deno",\n    handler,\n    payloadSchema: handler.payloadSchema,\n  };\n}',
    '',
    'function createLocalJobDefinition<TId extends string, THandler extends SchemaBackedJobHandler>(id: TId, entrypoint: string, handler: THandler): GeneratedJobDefinition<TId, THandler> {\n  return createJobDefinition(id, entrypoint, "local", handler);\n}',
    '',
    'function createPluginJobDefinition<TId extends string, THandler extends SchemaBackedJobHandler>(id: TId, pluginId: string, entrypoint: string, handler: THandler): GeneratedJobDefinition<TId, THandler> {\n  return createJobDefinition(id, entrypoint, "plugin", handler, pluginId);\n}',
    '',
    'function createJobDefinition<TId extends string, THandler extends SchemaBackedJobHandler>(id: TId, entrypoint: string, source: "local" | "plugin", handler: THandler, pluginId?: string): GeneratedJobDefinition<TId, THandler> {\n  return {\n    id,\n    name: toJobName(id),\n    entrypoint,\n    topic: "default",\n    source,\n    ...(pluginId ? { pluginId } : {}),\n    executionType: "deno",\n    timezone: "UTC",\n    timeout: 300000,\n    maxRetries: 3,\n    retryDelay: 1000,\n    maxConcurrency: 1,\n    priority: 50,\n    enabled: true,\n    persist: true,\n    tags: source === "plugin" ? ["plugin", pluginId ?? "unknown"] : [],\n    handler,\n    payloadSchema: handler.payloadSchema,\n  };\n}',
    '',
    'function toRegisterJobInput(definition: RegisterJobInput): RegisterJobInput {\n  const { handler: _handler, payloadSchema: _payloadSchema, ...registration } = definition;\n  return registration;\n}',
    '',
    'function toJobName(id: string): string {\n  return id.split("-").filter(Boolean).map((part) =>\n    `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`\n  ).join(" ");\n}',
    '',
  );
  if (entries.some((entry) => entry.source === 'plugin' && entry.policy)) {
    lines.push(
      'function assertJobHandlerId(handler: SchemaBackedJobHandler & Readonly<{ id: string }>, expectedId: string, path: string): string {\n  if (handler.id !== expectedId) {\n    throw new Error(`Workers config id "${expectedId}" does not match discovered plugin handler id "${String(handler.id)}" at ${path}.`);\n  }\n  return expectedId;\n}',
      '',
    );
  }
  lines.push(
    'type ResolvedJobHandler<TModule> =\n  TModule extends { readonly default: infer TDefault }\n    ? TDefault extends SchemaBackedJobHandler ? TDefault : never\n    : TModule extends { readonly handler: infer THandler }\n      ? THandler extends SchemaBackedJobHandler ? THandler : never\n      : never;',
    '',
    'function resolveJobHandler<TModule extends Record<string, unknown>>(module: TModule, path: string): ResolvedJobHandler<TModule> {\n  const candidate = module.default ?? module.handler;\n  if (typeof candidate !== "function" || !("payloadSchema" in candidate)) {\n    throw new Error(`Worker job module ${path} must export a schema-backed handler as default or handler.`);\n  }\n  return candidate as ResolvedJobHandler<TModule>;\n}',
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
