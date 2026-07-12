import { assertEquals } from 'jsr:@std/assert@^1';
import type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
import { compileWorkersRegistry } from '../../src/cli/registry-compiler.ts';

/**
 * Golden byte-identity test for the workers static job registry compiler.
 *
 * Locks the exact emitted module so the thin-wrapper refactor over the shared
 * `@netscript/plugin/cli` registry emitter cannot drift a single byte.
 */
Deno.test('compileWorkersRegistry emits the golden job registry module', async () => {
  const files = new MemoryProjectFiles([
    'workers/jobs/example-job.ts',
    'workers/jobs/health-check.ts',
    'workers/jobs/nested/deep-job.ts',
  ]);

  const result = await compileWorkersRegistry(files);

  assertEquals(result.registryPath, '.netscript/generated/plugin-workers/job-registry.ts');
  assertEquals(result.jobs, [
    'workers/jobs/example-job.ts',
    'workers/jobs/health-check.ts',
    'workers/jobs/nested/deep-job.ts',
  ]);

  const written = files.written.get('.netscript/generated/plugin-workers/job-registry.ts');
  assertEquals(written, EXPECTED_WORKERS_REGISTRY);
});

const EXPECTED_WORKERS_REGISTRY =
  `import type { StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';
import * as job0 from "../../../workers/jobs/example-job.ts";
import * as job1 from "../../../workers/jobs/health-check.ts";
import * as job2 from "../../../workers/jobs/nested/deep-job.ts";

type StaticJobHandler = StaticJobRegistry extends ReadonlyMap<string, infer THandler>
  ? THandler
  : never;

const entries: readonly [string, StaticJobHandler][] = [
  ["example-job", resolveJobHandler(job0, "workers/jobs/example-job.ts")],
  ["health-check", resolveJobHandler(job1, "workers/jobs/health-check.ts")],
  ["deep-job", resolveJobHandler(job2, "workers/jobs/nested/deep-job.ts")],
];

export const jobRegistry: StaticJobRegistry = new Map(entries);
export const registry: StaticJobRegistry = jobRegistry;

function resolveJobHandler(module: Record<string, unknown>, path: string): StaticJobHandler {
  const candidate = module.default ?? module.handler ?? firstFunctionExport(module);
  if (typeof candidate !== "function") {
    throw new Error(\`Worker job module \${path} does not export a function handler.\`);
  }
  return candidate as StaticJobHandler;
}

function firstFunctionExport(module: Record<string, unknown>): unknown {
  return Object.values(module).find((value) => typeof value === "function");
}
`;

/** In-memory {@linkcode ProjectFiles} fixture for deterministic golden tests. */
class MemoryProjectFiles implements ProjectFiles {
  readonly projectRoot = '/project';
  readonly written = new Map<string, string>();
  readonly #contents: Map<string, string>;

  constructor(paths: readonly string[]) {
    this.#contents = new Map(paths.map((path) => [path, 'export default () => {};']));
  }

  resolve(path: string): string {
    return `${this.projectRoot}/${path}`;
  }

  // deno-lint-ignore require-await
  async writeTextFile(path: string, content: string): Promise<void> {
    this.written.set(path, content);
  }

  // deno-lint-ignore require-await
  async readTextFile(path: string): Promise<string | undefined> {
    return this.#contents.get(path);
  }

  // deno-lint-ignore require-await
  async removeFile(path: string): Promise<boolean> {
    return this.#contents.delete(path);
  }

  // deno-lint-ignore require-await
  async listFiles(path: string, extensions: readonly string[] = []): Promise<
    readonly ProjectFileEntry[]
  > {
    const prefix = `${path}/`;
    const entries: ProjectFileEntry[] = [];
    for (const [relativePath, content] of this.#contents) {
      if (!relativePath.startsWith(prefix)) continue;
      if (extensions.length && !extensions.some((ext) => relativePath.endsWith(ext))) continue;
      entries.push(
        Object.freeze({ path: this.resolve(relativePath), relativePath, size: content.length }),
      );
    }
    return Object.freeze(
      entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
    );
  }

  toImportUrl(path: string): string {
    return `file://${this.resolve(path)}`;
  }

  relative(path: string): string {
    return path.startsWith(`${this.projectRoot}/`) ? path.slice(this.projectRoot.length + 1) : path;
  }
}
