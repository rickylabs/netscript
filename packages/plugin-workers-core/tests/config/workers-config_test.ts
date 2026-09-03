import { assert, assertEquals } from '@std/assert';
import {
  defineWorkers,
  type JobConfigInput,
  JobConfigSchema,
  WorkersConfigSchema,
} from '../../src/config/mod.ts';

const minimalJob = {
  id: 'send-email',
  name: 'Send email',
  entrypoint: './workers/jobs/send-email.ts',
} satisfies JobConfigInput;

Deno.test('JobConfig applies canonical policy defaults', () => {
  const config = JobConfigSchema.parse(minimalJob);

  assertEquals(config.priority, 50);
  assertEquals(config.retryDelay, 1000);
  assertEquals(config.maxConcurrency, 1);
  assertEquals(config.persist, true);
});

Deno.test('JobConfig accepts explicit policy values including zero concurrency', () => {
  const config = JobConfigSchema.parse({
    ...minimalJob,
    priority: 100,
    retryDelay: 250,
    maxConcurrency: 0,
    persist: false,
  });

  assertEquals(config.priority, 100);
  assertEquals(config.retryDelay, 250);
  assertEquals(config.maxConcurrency, 0);
  assertEquals(config.persist, false);
});

Deno.test('JobConfig rejects invalid policy numbers', () => {
  const invalidPolicies: ReadonlyArray<Readonly<Record<string, number>>> = [
    { priority: -1 },
    { priority: 101 },
    { priority: 1.5 },
    { retryDelay: -1 },
    { retryDelay: 0.5 },
    { maxConcurrency: -1 },
    { maxConcurrency: 0.5 },
  ];

  for (const policy of invalidPolicies) {
    const result = JobConfigSchema.safeParse({ ...minimalJob, ...policy });
    assert(!result.success, `expected policy to be rejected: ${JSON.stringify(policy)}`);
  }
});

Deno.test('WorkersConfig preserves group topic normalization', () => {
  const config = WorkersConfigSchema.parse({
    groups: [{
      topic: 'mail',
      jobs: [{ ...minimalJob, topic: 'ignored' }],
    }],
  });

  assertEquals(config?.groups[0].jobs[0].topic, 'mail');
});

Deno.test('JobConfigInput remains a defaults-optional authoring shape', () => {
  const authored = defineWorkers({ jobs: [minimalJob] });
  const parsed = WorkersConfigSchema.parse(authored);

  assertEquals(authored.jobs, [minimalJob]);
  assertEquals(parsed?.jobs[0].priority, 50);
  assertEquals(parsed?.jobs[0].retryDelay, 1000);
  assertEquals(parsed?.jobs[0].maxConcurrency, 1);
  assertEquals(parsed?.jobs[0].persist, true);
});
