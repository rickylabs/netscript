import { assertEquals, assertExists } from '@std/assert';
import {
  extractFromTraceContext,
  formatTraceparent,
  getSpanFromContext,
  parseTraceparent,
  parseTraceState,
} from '../../context.ts';

const REMOTE_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REMOTE_PARENT_ID = 'bbbbbbbbbbbbbbbb';

Deno.test('traceparent formatting round-trips through the parser', () => {
  const traceparent = formatTraceparent({
    traceId: '0123456789abcdef0123456789abcdef',
    spanId: '0123456789abcdef',
    traceFlags: 1,
    isRemote: false,
  });

  const parsed = parseTraceparent(traceparent);

  assertExists(parsed);
  assertEquals(parsed.traceId, '0123456789abcdef0123456789abcdef');
  assertEquals(parsed.parentId, '0123456789abcdef');
  assertEquals(parsed.traceFlags, 1);
});

Deno.test('parseTraceparent rejects the reserved ff version', () => {
  assertEquals(
    parseTraceparent(`ff-${REMOTE_TRACE_ID}-${REMOTE_PARENT_ID}-01`),
    null,
  );
});

Deno.test('parseTraceparent rejects all-zero and non-hex identifiers', () => {
  assertEquals(
    parseTraceparent(`00-${'0'.repeat(32)}-${REMOTE_PARENT_ID}-01`),
    null,
  );
  assertEquals(
    parseTraceparent(`00-${REMOTE_TRACE_ID}-${'0'.repeat(16)}-01`),
    null,
  );
  assertEquals(
    parseTraceparent(`00-${'z'.repeat(32)}-${REMOTE_PARENT_ID}-01`),
    null,
  );
});

Deno.test('parseTraceState drops malformed members and caps at 32 entries', () => {
  assertEquals(parseTraceState(undefined), undefined);
  assertEquals(parseTraceState('   '), undefined);
  assertEquals(parseTraceState('=novalue,bad,key=')?.serialize(), undefined);

  const state = parseTraceState('vendorA=1, vendorB=2 ,broken');
  assertExists(state);
  assertEquals(state.serialize(), 'vendorA=1,vendorB=2');
  assertEquals(state.get('vendorB'), '2');

  const members = Array.from({ length: 40 }, (_, i) => `k${i}=v${i}`).join(',');
  const capped = parseTraceState(members);
  assertExists(capped);
  assertEquals(capped.serialize().split(',').length, 32);
});

Deno.test('extractFromTraceContext preserves tracestate through the fallback (regression)', () => {
  // No W3C propagator/provider is registered in unit tests, so extraction takes
  // the manual traceparent fallback. Before the fix this path dropped
  // `tracestate`; the span context must now round-trip both fields.
  const ctx = extractFromTraceContext({
    traceparent: `00-${REMOTE_TRACE_ID}-${REMOTE_PARENT_ID}-01`,
    tracestate: 'vendorA=abc123,vendorB=xyz',
  });

  const spanContext = getSpanFromContext(ctx)?.spanContext();
  assertExists(spanContext);
  assertEquals(spanContext.traceId, REMOTE_TRACE_ID);
  assertEquals(spanContext.spanId, REMOTE_PARENT_ID);
  assertEquals(spanContext.isRemote, true);
  assertEquals(spanContext.traceState?.serialize(), 'vendorA=abc123,vendorB=xyz');
});
