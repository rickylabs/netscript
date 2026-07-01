import { assertEquals } from 'jsr:@std/assert@^1';
import type { RegisterJobInput } from '@netscript/plugin-workers-core/runtime';
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
  const runtime = {
    jobRegistry: {
      get: (id: string) => Promise.resolve(registered.get(id)),
      registerJob: (input: RegisterJobInput) => {
        if (!input.id) throw new Error('registered job is missing id');
        registered.set(input.id, input);
        return Promise.resolve(input);
      },
    },
  } as unknown as WorkersServiceRuntime;

  await registerGeneratedJobDefinitions(runtime, registryUrl);

  assertEquals(registered.get('embed-document')?.entrypoint, './workers/jobs/embed-document.ts');
});

Deno.test('registerGeneratedJobDefinitions tolerates a missing generated registry', async () => {
  const registered = new Map<string, RegisterJobInput>();
  const runtime = {
    jobRegistry: {
      get: (id: string) => Promise.resolve(registered.get(id)),
      registerJob: (input: RegisterJobInput) => {
        if (!input.id) throw new Error('registered job is missing id');
        registered.set(input.id, input);
        return Promise.resolve(input);
      },
    },
  } as unknown as WorkersServiceRuntime;

  await registerGeneratedJobDefinitions(
    runtime,
    new URL(`file://${await Deno.makeTempDir()}/missing/job-registry.ts`),
  );

  assertEquals(registered.size, 0);
});
