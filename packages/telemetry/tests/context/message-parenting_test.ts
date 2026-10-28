import { assertEquals, assertExists } from '@std/assert';
import { context, propagation, ROOT_CONTEXT, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import {
  extractContext,
  extractFromTraceContext,
  getSpanFromContext,
  type PropagationHeaders,
  resolveParentContextFromHeaders,
} from '../../context.ts';

const WORKER_TRACE_ID = '11111111111111111111111111111111';
const MESSAGE_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const MESSAGE_PARENT_ID = 'bbbbbbbbbbbbbbbb';
const TRACEPARENT = `00-${MESSAGE_TRACE_ID}-${MESSAGE_PARENT_ID}-00`;
const TRACESTATE = 'vendor1=first,vendor2=second';

Deno.test('incoming carriers isolate ambient worker context with and without a W3C propagator', () => {
  context.disable();
  propagation.disable();
  const manager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(manager);
  const worker = trace.setSpanContext(ROOT_CONTEXT, {
    traceId: WORKER_TRACE_ID,
    spanId: '2222222222222222',
    traceFlags: 1,
  });
  try {
    for (const registered of [false, true]) {
      propagation.disable();
      if (registered) propagation.setGlobalPropagator(new W3CTraceContextPropagator());
      context.with(worker, () => {
        const unparented: PropagationHeaders[] = [
          {},
          { traceparent: 'invalid' },
          { tracestate: TRACESTATE },
        ];
        for (const headers of unparented) {
          assertEquals(getSpanFromContext(extractContext(headers)), undefined);
          assertEquals(getSpanFromContext(resolveParentContextFromHeaders(headers)), undefined);
        }
        assertEquals(getSpanFromContext(resolveParentContextFromHeaders()), undefined);

        for (
          const extracted of [
            extractContext({ traceparent: TRACEPARENT, tracestate: TRACESTATE }),
            extractFromTraceContext({ traceparent: TRACEPARENT, tracestate: TRACESTATE }),
            resolveParentContextFromHeaders({
              Traceparent: TRACEPARENT,
              Tracestate: TRACESTATE,
            }),
          ]
        ) {
          const parent = getSpanFromContext(extracted)?.spanContext();
          assertExists(parent);
          assertEquals(parent.traceId, MESSAGE_TRACE_ID);
          assertEquals(parent.spanId, MESSAGE_PARENT_ID);
          assertEquals(parent.traceFlags, 0);
          assertEquals(parent.isRemote, true);
          assertEquals(parent.traceState?.serialize(), TRACESTATE);
        }
        assertEquals(trace.getSpan(context.active())?.spanContext().traceId, WORKER_TRACE_ID);
      });
    }
  } finally {
    context.disable();
    propagation.disable();
    manager.disable();
  }
});
