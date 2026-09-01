import { assertEquals } from 'jsr:@std/assert@^1';
import type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
import { JobConfigSchema } from '@netscript/plugin-workers-core/config';
import { z } from 'zod';
import { compileWorkersRegistry } from '../../src/cli/registry-compiler.ts';

/**
 * Golden byte-identity and JobConfig key-parity test for the workers registry compiler.
 *
 * Locks the exact emitted module so the thin-wrapper refactor over the shared
 * `@netscript/plugin/cli` registry emitter cannot drift a single byte.
 */
Deno.test('compileWorkersRegistry emits golden output in JobConfig key parity', async () => {
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
  assertJobConfigKeysAreEmitted(written);
});

function assertJobConfigKeysAreEmitted(source: string | undefined): void {
  if (source === undefined) {
    throw new Error('The workers registry compiler did not write a registry module.');
  }
  if (!(JobConfigSchema instanceof z.ZodObject)) {
    throw new Error('JobConfigSchema must remain a Zod object for emitted-key parity checks.');
  }

  const definition = source.match(
    /function createLocalJobDefinition[\s\S]*?\x20{2}return \{\n(?<fields>[\s\S]*?)\n\x20{2}\};/,
  );
  if (definition?.groups?.fields === undefined) {
    throw new Error('Generated registry is missing the local job definition object.');
  }

  const emittedKeys = new Set(
    definition.groups.fields.matchAll(/^\x20{4}([A-Za-z_$][\w$]*)(?:,|:)/gm).map((match) =>
      match[1]
    ),
  );
  const missingKeys = Object.keys(JobConfigSchema.shape).filter((key) => !emittedKeys.has(key));
  assertEquals(
    missingKeys,
    [],
    `Generated registry dropped JobConfig keys: ${missingKeys.join(', ')}`,
  );
}

const EXPECTED_WORKERS_REGISTRY =
  `import type { RegisterJobInput, StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';
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

const jobDefinitionEntries: readonly [string, RegisterJobInput][] = [
  ["example-job", createLocalJobDefinition("example-job", "./example-job.ts")],
  ["health-check", createLocalJobDefinition("health-check", "./health-check.ts")],
  ["deep-job", createLocalJobDefinition("deep-job", "./nested/deep-job.ts")],
];

export const jobDefinitions = new Map<string, RegisterJobInput>(jobDefinitionEntries);
export const definitions = jobDefinitions;

function createLocalJobDefinition(id: string, entrypoint: string): RegisterJobInput {
  return {
    id,
    name: toJobName(id),
    description: undefined,
    entrypoint,
    topic: "default",
    source: "local",
    schedule: undefined,
    executionType: "deno",
    timezone: "UTC",
    timeout: 300000,
    maxRetries: 3,
    retryDelay: 1000,
    maxConcurrency: 1,
    priority: 50,
    enabled: true,
    persist: true,
    permissions: undefined,
    tags: [],
    metadata: undefined,
    retention: undefined,
  };
}

function toJobName(id: string): string {
  return id.split("-").filter(Boolean).map((part) =>
    \`\${part.slice(0, 1).toUpperCase()}\${part.slice(1)}\`
  ).join(" ");
}

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
