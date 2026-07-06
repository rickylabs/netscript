import { assertEquals } from '@std/assert';
import { createInMemorySpanRecorder } from '../../src/testing/mod.ts';
import { withSpan } from '../../mod.ts';
import { SpanStatusCode } from '../../src/domain/types.ts';

Deno.test('in-memory recorder captures span name, attributes, and ok status', async () => {
  const recorder = createInMemorySpanRecorder();

  await withSpan(recorder, 'unit.work', (span) => {
    span.setAttribute('netscript.unit', 'recorder');
    span.addEvent('progress', { pct: 50 });
  });

  const [snapshot] = recorder.snapshots();
  assertEquals(recorder.size, 1);
  assertEquals(snapshot?.name, 'unit.work');
  assertEquals(snapshot?.attributes['netscript.unit'], 'recorder');
  assertEquals(snapshot?.events[0]?.name, 'progress');
  assertEquals(snapshot?.status.code, SpanStatusCode.OK);
  assertEquals(snapshot?.ended, true);
});

Deno.test('in-memory recorder records exception and error status on throw', async () => {
  const recorder = createInMemorySpanRecorder();

  await withSpan(recorder, 'unit.fail', () => {
    throw new Error('boom');
  }).catch(() => {});

  const [snapshot] = recorder.snapshots();
  assertEquals(snapshot?.status.code, SpanStatusCode.ERROR);
  assertEquals(snapshot?.exceptions.length, 1);
});

Deno.test('in-memory recorder reset clears captured spans', () => {
  const recorder = createInMemorySpanRecorder();
  recorder.startSpan('a');
  recorder.startSpan('b');
  assertEquals(recorder.size, 2);
  recorder.reset();
  assertEquals(recorder.size, 0);
});
