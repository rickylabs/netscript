import { assertEquals, assertExists } from '@std/assert';
import { createJobTraceEnv, extractJobTraceContext } from '../../context.ts';

Deno.test('createJobTraceEnv omits values when no active span is present', () => {
  assertEquals(createJobTraceEnv(), {});
});

Deno.test('extractJobTraceContext restores context from TRACEPARENT env vars', () => {
  Deno.env.set('TRACEPARENT', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01');
  Deno.env.set('TRACESTATE', 'vendor=value');

  try {
    const context = extractJobTraceContext();
    assertExists(context);
  } finally {
    Deno.env.delete('TRACEPARENT');
    Deno.env.delete('TRACESTATE');
  }
});
