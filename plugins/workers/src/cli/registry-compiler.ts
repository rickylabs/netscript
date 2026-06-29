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
      `  [${JSON.stringify(toJobId(job.relativePath))}, resolveJobHandler(${alias}, ${
        JSON.stringify(job.relativePath)
      })],`,
    ],
    header: [
      "import type { StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';",
    ],
    body: (entries) => [
      'type StaticJobHandler = StaticJobRegistry extends ReadonlyMap<string, infer THandler>',
      '  ? THandler',
      '  : never;',
      '',
      'const entries: readonly [string, StaticJobHandler][] = [',
      ...entries,
      '];',
      '',
      'export const jobRegistry: StaticJobRegistry = new Map(entries);',
      'export const registry: StaticJobRegistry = jobRegistry;',
      '',
      'function resolveJobHandler(module: Record<string, unknown>, path: string): StaticJobHandler {',
      '  const candidate = module.default ?? module.handler ?? firstFunctionExport(module);',
      '  if (typeof candidate !== "function") {',
      '    throw new Error(`Worker job module ${path} does not export a function handler.`);',
      '  }',
      '  return candidate as StaticJobHandler;',
      '}',
      '',
      'function firstFunctionExport(module: Record<string, unknown>): unknown {',
      '  return Object.values(module).find((value) => typeof value === "function");',
      '}',
      '',
    ],
  });
}

function toJobId(path: string): string {
  const fileName = path.split('/').at(-1) ?? path;
  return fileName.replace(/\.ts$/, '');
}
