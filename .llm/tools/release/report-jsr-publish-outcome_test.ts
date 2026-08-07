import { assertEquals } from '@std/assert';
import { reportJsrPublishOutcome } from './report-jsr-publish-outcome.ts';

Deno.test('publish outcome distinguishes none, partial, and complete exact-version presence', async () => {
  const names = ['@netscript/a', '@netscript/b'];
  const read = (present: ReadonlySet<string>) => (name: string) =>
    Promise.resolve(present.has(name) ? ['0.0.5-canary.11'] : []);
  assertEquals(
    (await reportJsrPublishOutcome('0.0.5-canary.11', names, read(new Set()))).kind,
    'none',
  );
  const partial = await reportJsrPublishOutcome(
    '0.0.5-canary.11',
    names,
    read(new Set([names[0]])),
  );
  assertEquals(partial, { kind: 'partial', published: [names[0]], missing: [names[1]] });
  assertEquals(
    (await reportJsrPublishOutcome('0.0.5-canary.11', names, read(new Set(names)))).kind,
    'complete',
  );
});
