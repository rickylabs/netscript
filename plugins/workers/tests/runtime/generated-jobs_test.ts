/**
 * Regression guards for generated workers job registry loading (#951).
 *
 * A job compiled into `.netscript/generated/plugin-workers/job-registry.ts` that
 * the running worker runtime never registers surfaces as an oRPC `NOT_FOUND` at
 * dispatch time — after the caller has already committed its own writes. These
 * tests hold the two properties that keep that from recurring: exactly one
 * resolver for the registry path, and a startup failure (never silence) when a
 * registry exists but did not reach the runtime registry.
 *
 * @module
 */

import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import type { RegisterJobInput } from '@netscript/plugin-workers-core/runtime';
import {
  GeneratedJobRegistryError,
  loadGeneratedJobRegistry,
  registerGeneratedJobRegistry,
  resolveGeneratedJobRegistryUrl,
  WORKERS_JOB_REGISTRY_PATH,
} from '../../src/runtime/generated-jobs.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));

/** Entrypoints that start a workers process and therefore need the generated jobs. */
const WORKERS_ENTRYPOINTS = [
  'bin/combined.ts',
  'bin/runtime.ts',
  'bin/scheduler.ts',
  'bin/worker.ts',
  'services/src/main.ts',
  'services/src/generated-jobs.ts',
  'src/adapter/resources/glue/runtime.stub.ts',
] as const;

Deno.test('resolveGeneratedJobRegistryUrl anchors on the project root', async () => {
  const projectRoot = await Deno.makeTempDir();
  const previous = Deno.cwd();
  try {
    Deno.chdir(projectRoot);
    assertEquals(
      fromFileUrl(resolveGeneratedJobRegistryUrl()),
      fromFileUrl(new URL(WORKERS_JOB_REGISTRY_PATH, `file://${Deno.cwd()}/`)),
    );
  } finally {
    Deno.chdir(previous);
  }
});

Deno.test('no workers entrypoint resolves the generated registry path itself', async () => {
  // `bin/combined.ts` resolved `../../<registry path>` against its own module URL
  // and landed in `plugins/` instead of the project root, so it silently ran with
  // zero user jobs. One resolver is the invariant; a second one is the defect.
  // Re-exporting the WORKERS_JOB_REGISTRY_PATH constant is fine — building a URL
  // out of it anywhere but the resolver is not.
  const forbidden = [
    /new URL\([^)]*WORKERS_JOB_REGISTRY_PATH/,
    /new URL\([^)]*job-registry\.ts/,
    /projectFileUrl\(\s*WORKERS_JOB_REGISTRY_PATH/,
    /['"`][^'"`]*\.netscript\/generated\/plugin-workers\/job-registry\.ts/,
  ];

  for (const entrypoint of WORKERS_ENTRYPOINTS) {
    const source = await Deno.readTextFile(`${PLUGIN_ROOT}${entrypoint}`);
    for (const pattern of forbidden) {
      assertEquals(
        pattern.test(source),
        false,
        `${entrypoint} builds its own generated-registry path (matched ${pattern}); ` +
          'use resolveGeneratedJobRegistryUrl() instead.',
      );
    }
  }
});

Deno.test('an absent generated registry is reported, not silently empty', async () => {
  const url = new URL(`file://${await Deno.makeTempDir()}/missing/job-registry.ts`);

  const loaded = await loadGeneratedJobRegistry(url);

  assertEquals(loaded.status, 'absent');
  assertEquals(loaded.url.href, url.href);
  assertEquals(loaded.definitions, undefined);
});

Deno.test('literal generated definitions take precedence so payload schemas reach registration', async () => {
  const url = await writeRegistry([
    'const payloadSchema = {',
    '  "~standard": { version: 1, vendor: "test", validate: (value) => ({ value }) },',
    '};',
    'export const jobDefinitionsById = {',
    '  "typed-job": { id: "typed-job", payloadSchema },',
    '};',
    'export const jobDefinitions = new Map([["fallback-job", { id: "fallback-job" }]]);',
  ].join('\n'));

  const loaded = await loadGeneratedJobRegistry(url);

  assertEquals(loaded.status, 'loaded');
  assertEquals(loaded.definitions?.has('typed-job'), true);
  assertEquals(loaded.definitions?.has('fallback-job'), false);
  assertEquals(loaded.definitions?.get('typed-job')?.payloadSchema?.['~standard'].vendor, 'test');
});

Deno.test('a generated registry without job definitions fails at startup', async () => {
  const url = await writeRegistry('export const registry = new Map();');

  const error = await assertRejects(
    () => loadGeneratedJobRegistry(url),
    GeneratedJobRegistryError,
  );

  assertStringIncludes(error.message, "exports no 'jobDefinitions' map");
});

Deno.test('a generated registry that fails to import fails at startup', async () => {
  const url = await writeRegistry('export const jobDefinitions = ((((;');

  await assertRejects(() => loadGeneratedJobRegistry(url), GeneratedJobRegistryError);
});

Deno.test('registerGeneratedJobRegistry registers every declared job', async () => {
  const url = await writeRegistry(registrySource(['rehearse-release', 'embed-document']));
  const registry = new FakeJobRegistry();

  const loaded = await registerGeneratedJobRegistry(registry, await loadGeneratedJobRegistry(url));

  assertEquals(loaded.status, 'loaded');
  assertEquals([...registry.registered.keys()].sort(), ['embed-document', 'rehearse-release']);
  assertEquals(
    registry.registered.get('rehearse-release')?.entrypoint,
    './rehearse-release.ts',
  );
});

Deno.test('registerGeneratedJobRegistry fails loudly when a job does not land', async () => {
  const url = await writeRegistry(registrySource(['rehearse-release']));
  // A registry whose writes report success but never read back — the KV-namespace
  // and wrong-runtime-instance class of failure. Previously this produced a
  // running worker that answered triggerJob with NOT_FOUND.
  const registry = new FakeJobRegistry({ dropWrites: true });

  const error = await assertRejects(
    async () => await registerGeneratedJobRegistry(registry, await loadGeneratedJobRegistry(url)),
    GeneratedJobRegistryError,
  );

  assertStringIncludes(error.message, 'missing: rehearse-release');
  assertStringIncludes(error.message, 'NOT_FOUND');
});

Deno.test('an empty generated registry is a valid load, not a failure', async () => {
  const url = await writeRegistry(registrySource([]));
  const registry = new FakeJobRegistry();

  const loaded = await registerGeneratedJobRegistry(registry, await loadGeneratedJobRegistry(url));

  assertEquals(loaded.status, 'loaded');
  assertEquals(registry.registered.size, 0);
});

class FakeJobRegistry {
  readonly registered = new Map<string, RegisterJobInput>();
  readonly #dropWrites: boolean;

  constructor(options: { readonly dropWrites?: boolean } = {}) {
    this.#dropWrites = options.dropWrites ?? false;
  }

  get(id: string): Promise<RegisterJobInput | undefined> {
    return Promise.resolve(this.registered.get(id));
  }

  registerJob(input: RegisterJobInput): Promise<RegisterJobInput> {
    if (!input.id) throw new Error('registered job is missing id');
    if (!this.#dropWrites) this.registered.set(input.id, input);
    return Promise.resolve(input);
  }
}

function registrySource(ids: readonly string[]): string {
  const entries = ids.map((id) =>
    `  [${JSON.stringify(id)}, ${JSON.stringify(jobDefinition(id))}],`
  );
  return ['export const jobDefinitions = new Map([', ...entries, ']);'].join('\n');
}

function jobDefinition(id: string): Record<string, unknown> {
  return {
    id,
    name: id,
    entrypoint: `./${id}.ts`,
    topic: 'default',
    source: 'local',
    executionType: 'deno',
    timezone: 'UTC',
    timeout: 300000,
    maxRetries: 3,
    retryDelay: 1000,
    maxConcurrency: 1,
    priority: 50,
    enabled: true,
    persist: true,
    tags: [],
  };
}

async function writeRegistry(source: string): Promise<URL> {
  const url = new URL(`file://${await Deno.makeTempDir()}/job-registry.ts`);
  await Deno.writeTextFile(url, source);
  return url;
}
