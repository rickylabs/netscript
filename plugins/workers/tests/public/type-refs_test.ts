import { assertEquals } from '@std/assert';
import type { JobResult, PublicStandardSchema } from '@netscript/plugin-workers/contracts';
import type {
  GeneratedJobRegistryStatus,
  StaticJobRegistry,
} from '@netscript/plugin-workers/runtime';
import type {
  TriggerType,
  WorkerIdempotencyClaim,
  WorkerIdempotencyPort,
} from '@netscript/plugin-workers/worker';
import type {
  StateSchema,
  StreamStateDefinition,
  WorkerStreamEntities,
} from '@netscript/plugin-workers/streams/server';
import manifest from '../../deno.json' with { type: 'json' };

Deno.test('workers keeps all thirteen published export targets', () => {
  assertEquals(Object.keys(manifest.exports).sort(), [
    '.',
    './adapter-cli',
    './aspire',
    './cli',
    './contracts',
    './doctor',
    './jobs/health-check.ts',
    './runtime',
    './scaffold',
    './services',
    './streams',
    './streams/server',
    './worker',
  ]);
});

Deno.test('workers consumer vocabulary preserves payload and discriminant precision', () => {
  const result: JobResult<{ count: number }> = { success: true, data: { count: 1 } };
  const status: GeneratedJobRegistryStatus = 'loaded';
  const trigger: TriggerType = 'manual';
  assertEquals(result.data?.count, 1);
  assertEquals(status, 'loaded');
  assertEquals(trigger, 'manual');

  // @ts-expect-error Results retain their declared payload type.
  const invalid: JobResult<{ count: number }> = { success: true, data: { count: 'one' } };
  // @ts-expect-error Stream entity kinds stay closed.
  const entity: keyof WorkerStreamEntities = 'unknown';
  void invalid;
  void entity;
});

// These public imports must resolve without reaching into implementation files.
export type ConsumerVocabulary = Readonly<{
  schema: PublicStandardSchema<unknown>;
  registry: StaticJobRegistry;
  idempotency: WorkerIdempotencyPort;
  claim: WorkerIdempotencyClaim;
  streams: StateSchema<StreamStateDefinition>;
}>;

Deno.test('workers non-contract entrypoints have no documentation diagnostics', async () => {
  const root = new URL('../../', import.meta.url);
  const paths = Object.entries(manifest.exports)
    // #1655 owns the four remaining contract references; remove this exclusion when repaired.
    .filter(([subpath]) => subpath !== './contracts')
    .map(([, path]) => new URL(path, root).pathname);
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--lint', ...paths],
    cwd: new URL('../../../../', import.meta.url),
    stdout: 'null',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
});
