import { dirname, relative } from '@std/path';
import type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';

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
  const registryDir = dirname(registryPath);
  const imports = jobs.map((job, index) => {
    const specifier = toRelativeImport(registryDir, job.relativePath);
    return `import * as job${index} from ${JSON.stringify(specifier)};`;
  });
  const entries = jobs.map((job, index) =>
    `  [${JSON.stringify(toJobId(job.relativePath))}, resolveJobHandler(job${index}, ${
      JSON.stringify(job.relativePath)
    })],`
  );

  return [
    "import type { StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';",
    ...imports,
    '',
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
  ].join('\n');
}

function toRelativeImport(fromDir: string, target: string): string {
  const specifier = relative(fromDir, target).replace(/\\/g, '/');
  return specifier.startsWith('.') ? specifier : `./${specifier}`;
}

function toJobId(path: string): string {
  const fileName = path.split('/').at(-1) ?? path;
  return fileName.replace(/\.ts$/, '');
}
