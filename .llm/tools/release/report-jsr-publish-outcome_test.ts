import { assertEquals, assertThrows } from '@std/assert';
import {
  assertCompleteJsrPublishOutcome,
  reportJsrPublishOutcome,
} from './report-jsr-publish-outcome.ts';

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

Deno.test('exact-version assertion names every missing package', () => {
  assertThrows(
    () =>
      assertCompleteJsrPublishOutcome('0.0.5', {
        kind: 'partial',
        published: ['@netscript/a'],
        missing: ['@netscript/b', '@netscript/c'],
      }),
    Error,
    'missing packages:\n- @netscript/b\n- @netscript/c',
  );
  assertCompleteJsrPublishOutcome('0.0.4', {
    kind: 'complete',
    published: ['@netscript/a'],
    missing: [],
  });
});
