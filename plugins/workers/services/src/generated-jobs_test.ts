import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import type { RegisterJobInput } from '@netscript/plugin-workers-core/runtime';
import { GeneratedJobRegistryError } from '../../src/runtime/generated-jobs.ts';
import { registerGeneratedJobDefinitions } from './generated-jobs.ts';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

Deno.test('registerGeneratedJobDefinitions loads user jobs into the API service runtime', async () => {
  const tempDir = await Deno.makeTempDir();
  const registryUrl = new URL(`file://${tempDir}/job-registry.ts`);
  await Deno.writeTextFile(
    registryUrl,
    [
      'export const jobDefinitions = new Map([',
      '  ["embed-document", {',
      '    id: "embed-document",',
      '    name: "Embed Document",',
      '    entrypoint: "./workers/jobs/embed-document.ts",',
      '    topic: "default",',
      '    source: "local",',
      '    executionType: "deno",',
      '    timezone: "UTC",',
      '    timeout: 300000,',
      '    maxRetries: 3,',
      '    retryDelay: 1000,',
      '    maxConcurrency: 1,',
      '    priority: 50,',
      '    enabled: true,',
      '    persist: true,',
      '    tags: [],',
      '  }],',
      ']);',
    ].join('\n'),
  );

  const registered = new Map<string, RegisterJobInput>();
  const runtime = fakeRuntime(registered);

  const loaded = await registerGeneratedJobDefinitions(runtime, registryUrl);

  assertEquals(loaded.status, 'loaded');
  assertEquals(registered.get('embed-document')?.entrypoint, './workers/jobs/embed-document.ts');
});

Deno.test('registerGeneratedJobDefinitions reports a missing generated registry', async () => {
  // A project with no compiled registry is legitimate: only plugin-owned jobs
  // exist. It must still be reported, so an unexpected `absent` is visible in the
  // startup log with the path that was checked rather than passing as silence.
  const registered = new Map<string, RegisterJobInput>();
  const registryUrl = new URL(`file://${await Deno.makeTempDir()}/missing/job-registry.ts`);

  const loaded = await registerGeneratedJobDefinitions(fakeRuntime(registered), registryUrl);

  assertEquals(loaded.status, 'absent');
  assertEquals(loaded.url.href, registryUrl.href);
  assertEquals(registered.size, 0);
});

Deno.test('registerGeneratedJobDefinitions fails when a compiled job does not register', async () => {
  const registryUrl = new URL(`file://${await Deno.makeTempDir()}/job-registry.ts`);
  await Deno.writeTextFile(
    registryUrl,
    'export const jobDefinitions = new Map([["rehearse-release", { id: "rehearse-release" }]]);',
  );

  // Writes are accepted and never read back — the failure that reached users as
  // an oRPC NOT_FOUND on the first triggerJob call.
  const runtime = {
    jobRegistry: {
      get: () => Promise.resolve(undefined),
      registerJob: (input: RegisterJobInput) => Promise.resolve(input),
    },
  } as unknown as WorkersServiceRuntime;

  await assertRejects(
    () => registerGeneratedJobDefinitions(runtime, registryUrl),
    GeneratedJobRegistryError,
  );
});

function fakeRuntime(registered: Map<string, RegisterJobInput>): WorkersServiceRuntime {
  return {
    jobRegistry: {
      get: (id: string) => Promise.resolve(registered.get(id)),
      registerJob: (input: RegisterJobInput) => {
        if (!input.id) throw new Error('registered job is missing id');
        registered.set(input.id, input);
        return Promise.resolve(input);
      },
    },
  } as unknown as WorkersServiceRuntime;
}
