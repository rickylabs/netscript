import { context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import type { Tracer } from '../../commands.ts';
import { getTracer } from '../../tracer.ts';
export const start = {
  name: 'values.update',
  definitionVersion: 1,
  provider: 'postgres',
  isolation: 'default',
  idempotency: 'claimed',
} as const;
export const done = {
  outcome: 'applied',
  idempotency: 'claimed',
  auditCount: 0,
  outboxCount: 1,
} as const;
let fixtures = 0;
export async function recording(
  work: (tracer: Tracer, exporter: InMemorySpanExporter) => Promise<void>,
): Promise<void> {
  context.disable();
  trace.disable();
  propagation.disable();
  const manager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(manager);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  trace.setGlobalTracerProvider(provider);
  try {
    await work(getTracer(`command-fixture-${++fixtures}`), exporter);
    await provider.forceFlush();
  } finally {
    await provider.shutdown();
    manager.disable();
    context.disable();
    trace.disable();
    propagation.disable();
  }
}
