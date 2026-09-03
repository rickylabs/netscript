import {
  type ProjectFileEntry,
  type ProjectFiles,
  renderRegistryModule,
} from '@netscript/plugin/cli';

/** Result returned after compiling a static job registry. */
export interface CompileRegistryResult {
  /** Generated registry path relative to the project root. */
  readonly registryPath: string;
  /** Job handler files included in the registry. */
  readonly jobs: readonly string[];
}

/** Compile a static registry from TypeScript files below `workers/jobs`. */
export async function compileWorkersRegistry(
  files: ProjectFiles,
  registryPath = '.netscript/generated/plugin-workers/job-registry.ts',
): Promise<CompileRegistryResult> {
  const jobs = await files.listFiles('workers/jobs', ['.ts']);
  const source = renderRegistrySource(registryPath, jobs);
  await files.writeTextFile(registryPath, source);
  return Object.freeze({
    registryPath,
    jobs: Object.freeze(jobs.map((job) => job.relativePath)),
  });
}

function renderRegistrySource(
  registryPath: string,
  jobs: readonly ProjectFileEntry[],
): string {
  return renderRegistryModule({
    registryPath,
    items: jobs,
    alias: (index) => `job${index}`,
    renderImport: (alias, specifier) => `import * as ${alias} from ${JSON.stringify(specifier)};`,
    renderEntry: (alias, job) => [
      `  readonly ${
        JSON.stringify(toJobId(job.relativePath))
      }: ResolvedJobHandler<typeof ${alias}>;`,
    ],
    header: [
      "import type { JobPayloadMap, RegisterJobInput, StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';",
    ],
    body: (entries) => [
      'type SchemaBackedJobHandler =',
      '  & ((...args: never[]) => unknown)',
      '  & Readonly<{ payloadSchema: unknown }>;',
      '',
      'type ResolvedJobHandler<TModule> =',
      '  TModule extends { readonly default: infer TDefault }',
      '    ? TDefault extends SchemaBackedJobHandler ? TDefault : never',
      '    : TModule extends { readonly handler: infer THandler }',
      '      ? THandler extends SchemaBackedJobHandler ? THandler : never',
      '      : never;',
      '',
      'export type GeneratedJobHandlerRegistry = Readonly<{',
      ...entries,
      '}>;',
      '',
      'export const jobHandlersById: GeneratedJobHandlerRegistry = Object.freeze({',
      ...jobs.map((job, index) =>
        `  [${JSON.stringify(toJobId(job.relativePath))}]: resolveJobHandler(job${index}, ${
          JSON.stringify(job.relativePath)
        }),`
      ),
      '});',
      '',
      'type StaticJobHandler = StaticJobRegistry extends ReadonlyMap<string, infer THandler>',
      '  ? THandler',
      '  : never;',
      '',
      'const entries: readonly [string, StaticJobHandler][] = [',
      ...jobs.map((job) => {
        const id = JSON.stringify(toJobId(job.relativePath));
        return `  [${id}, jobHandlersById[${id}]],`;
      }),
      '];',
      '',
      'export const jobRegistry: StaticJobRegistry = new Map(entries);',
      'export const registry: StaticJobRegistry = jobRegistry;',
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
      ...jobs.map((job) => {
        const id = JSON.stringify(toJobId(job.relativePath));
        return `  readonly ${id}: GeneratedJobDefinition<${id}, GeneratedJobHandlerRegistry[${id}]>;`;
      }),
      '}>;',
      '',
      'export type GeneratedJobPayloadMap = JobPayloadMap<GeneratedJobDefinitionRegistry>;',
      '',
      'export const jobDefinitionsById: GeneratedJobDefinitionRegistry = Object.freeze({',
      ...jobs.map((job) => {
        const id = JSON.stringify(toJobId(job.relativePath));
        const entrypoint = JSON.stringify(toJobEntrypoint(job.relativePath));
        return `  [${id}]: createLocalJobDefinition(${id}, ${entrypoint}, jobHandlersById[${id}]),`;
      }),
      '});',
      '',
      'const jobDefinitionEntries: readonly [string, RegisterJobInput][] = Object.entries(jobDefinitionsById)',
      '  .map(([id, definition]) => [id, toRegisterJobInput(definition)]);',
      '',
      'export const jobDefinitions: ReadonlyMap<string, RegisterJobInput> = new Map(jobDefinitionEntries);',
      'export const definitions: ReadonlyMap<string, RegisterJobInput> = jobDefinitions;',
      '',
      'function createLocalJobDefinition<TId extends string, THandler extends SchemaBackedJobHandler>(',
      '  id: TId,',
      '  entrypoint: string,',
      '  handler: THandler,',
      '): GeneratedJobDefinition<TId, THandler> {',
      '  return {',
      '    id,',
      '    name: toJobName(id),',
      '    description: undefined,',
      '    entrypoint,',
      '    topic: "default",',
      '    source: "local",',
      '    schedule: undefined,',
      '    executionType: "deno",',
      '    timezone: "UTC",',
      '    timeout: 300000,',
      '    maxRetries: 3,',
      '    retryDelay: 1000,',
      '    maxConcurrency: 1,',
      '    priority: 50,',
      '    enabled: true,',
      '    persist: true,',
      '    permissions: undefined,',
      '    tags: [],',
      '    metadata: undefined,',
      '    retention: undefined,',
      '    handler,',
      '    payloadSchema: handler.payloadSchema,',
      '  };',
      '}',
      '',
      'function toRegisterJobInput(definition: RegisterJobInput): RegisterJobInput {',
      '  const { handler: _handler, payloadSchema: _payloadSchema, ...registration } = definition;',
      '  return registration;',
      '}',
      '',
      'function toJobName(id: string): string {',
      '  return id.split("-").filter(Boolean).map((part) =>',
      '    `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`',
      '  ).join(" ");',
      '}',
      '',
      'function resolveJobHandler<TModule extends Record<string, unknown>>(',
      '  module: TModule,',
      '  path: string,',
      '): ResolvedJobHandler<TModule> {',
      '  const candidate = module.default ?? module.handler;',
      '  if (typeof candidate !== "function" || !("payloadSchema" in candidate)) {',
      '    throw new Error(',
      '      `Worker job module ${path} must export a schema-backed handler as default or handler.`,',
      '    );',
      '  }',
      '  return candidate as ResolvedJobHandler<TModule>;',
      '}',
      '',
    ],
  });
}

function toJobId(path: string): string {
  const fileName = path.split('/').at(-1) ?? path;
  return fileName.replace(/\.ts$/, '');
}

function toJobEntrypoint(path: string): string {
  const relativePath = path.replace(/^workers\/jobs\//, '');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}
