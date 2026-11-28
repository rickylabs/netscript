import { assertEquals } from '@std/assert';
import { context, ROOT_CONTEXT, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { getRootContext, isActiveContextRoot, withContext } from '../../context.ts';

Deno.test('getRootContext and isActiveContextRoot distinguish clean root, active spans, and non-span values', () => {
  context.disable();
  const manager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(manager);

  try {
    assertEquals(getRootContext(), ROOT_CONTEXT);
    assertEquals(isActiveContextRoot(), true);

    // Non-span context value (e.g. baggage or custom symbol key) must report non-root.
    const nonSpanKey = Symbol('telemetry-root-check-non-span');
    const nonSpanContext = getRootContext().setValue(nonSpanKey, 'ambient-value');
    withContext(nonSpanContext, () => {
      assertEquals(trace.getActiveSpan(), undefined);
      assertEquals(isActiveContextRoot(), false);

      // Re-entering getRootContext() restores clean root detection.
      withContext(getRootContext(), () => {
        assertEquals(isActiveContextRoot(), true);
      });
    });

    // Active span context must also report non-root.
    const spanContext = trace.setSpanContext(ROOT_CONTEXT, {
      traceId: '11111111111111111111111111111111',
      spanId: '2222222222222222',
      traceFlags: 1,
    });
    withContext(spanContext, () => {
      assertEquals(isActiveContextRoot(), false);
    });

    assertEquals(isActiveContextRoot(), true);
  } finally {
    context.disable();
    manager.disable();
  }
});
